import { Request, Response, NextFunction } from 'express';
import { pool } from './pool';
import { withTenant } from './schema';

export function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    res.status(400).json({ error: 'Missing x-tenant-id header' });
    return;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenantId)) {
    res.status(400).json({ error: 'Invalid tenant ID format' });
    return;
  }

  (req as any).tenantId = tenantId;
  next();
}

export function getTenantId(req: Request): string {
  return (req as any).tenantId;
}

export async function withTenantQuery<T>(
  req: Request,
  fn: (tenantId: string) => Promise<T>
): Promise<T> {
  const tenantId = getTenantId(req);
  return withTenant(tenantId, pool, () => fn(tenantId));
}

export async function verifyTenantIsolation(
  tenantIdA: string,
  tenantIdB: string
): Promise<boolean> {
  const clientA = await pool.connect();
  const clientB = await pool.connect();

  try {
    await clientA.query(`SET LOCAL app.current_tenant = '${tenantIdA}'`);
    await clientB.query(`SET LOCAL app.current_tenant = '${tenantIdB}'`);

    const resultA = await clientA.query('SHOW app.current_tenant');
    const resultB = await clientB.query('SHOW app.current_tenant');

    return (
      resultA.rows[0].current_setting !== resultB.rows[0].current_setting &&
      resultA.rows[0].current_setting === tenantIdA &&
      resultB.rows[0].current_setting === tenantIdB
    );
  } finally {
    clientA.release();
    clientB.release();
  }
}
