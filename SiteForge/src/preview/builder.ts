/**
 * Orchestrates the full preview generation flow:
 * 1. Compile AI data to JSON
 * 2. Run Astro build
 * 3. Upload to S3
 * 4. Create preview link
 */

import { compileBusinessData } from './compiler';
import { uploadPreview, getCdnUrl } from './storage/s3';
import { createPreviewLink } from './links/manager';
import { spawn } from 'child_process';
import { readFileSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';

export interface BuildOptions {
  businessId: string;
  tenantId: string;
  astroProjectPath: string;
  tempDir: string;
}

export interface BuildResult {
  previewUrl: string;
  s3Key: string;
  buildTimeMs: number;
}

/**
 * Build and deploy a preview landing page for a business.
 * Returns the preview URL.
 */
export async function buildPreview(options: BuildOptions): Promise<BuildResult> {
  const startTime = Date.now();
  const { businessId, tenantId, astroProjectPath, tempDir } = options;

  // Step 1: Compile AI data to JSON
  const dataDir = join(astroProjectPath, 'src', 'data', 'businesses');
  await compileBusinessData({
    businessId,
    tenantId,
    outputDir: dataDir,
  });

  // Step 2: Run Astro build
  await runAstroBuild(astroProjectPath);

  // Step 3: Find built HTML file
  const distDir = join(astroProjectPath, 'dist');
  const htmlFiles = findHtmlFiles(distDir);
  if (htmlFiles.length === 0) {
    throw new Error('Astro build produced no HTML files');
  }

  // For preview pages, we upload only the relevant business page
  const businessHtmlPath = htmlFiles.find(f => f.includes(businessId)) ?? htmlFiles[0];
  const htmlContent = readFileSync(businessHtmlPath);

  // Step 4: Upload to S3
  const s3Key = await uploadPreview({
    tenantId,
    businessId,
    content: htmlContent,
    contentType: 'text/html; charset=utf-8',
    cacheControl: 'public, max-age=3600',  // 1 hour CDN cache
  });

  // Step 5: Create preview link
  const { url: previewUrl } = await createPreviewLink({
    tenantId,
    businessId,
    s3Key,
    expiresInDays: 30,
  });

  // Cleanup temp data
  rmSync(dataDir, { recursive: true, force: true });

  return {
    previewUrl,
    s3Key,
    buildTimeMs: Date.now() - startTime,
  };
}

function runAstroBuild(projectPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], {
      cwd: projectPath,
      stdio: 'inherit',
    });

    build.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Astro build failed with code ${code}`));
    });

    build.on('error', reject);
  });
}

function findHtmlFiles(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      findHtmlFiles(fullPath, files);
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}
