# Pitfalls Research

**Domain:** AI-Powered Local Business Website Generation Platform
**Researched:** 2026-03-23
**Confidence:** LOW — Research conducted using training data only. Web search and Context7 verification unavailable in environment. All findings require validation before use.

---

## Critical Pitfalls

### Pitfall 1: Headless Browser Detection by Google Maps, Instagram, Facebook, Yelp

**What goes wrong:**
Scraping pipeline gets IP-banned or CAPTCHA-shadowed within minutes of starting. The headless Playwright browser is detected and blocked, returning empty pages or 403 errors. The entire scrape → generate pipeline stalls and never recovers.

**Why it happens:**
All major platforms invest heavily in bot detection. Headless Chrome/Chromium has detectable signatures: missing navigator.plugins, automated user agent strings, unusual timing patterns, absence of real mouse movements, and JavaScript fingerprinting (WebGL renderer, canvas hash, font list). Google Maps additionally uses Tessaract CAPTCHA for suspicious sessions. Instagram and Facebook use aggressive rate limiting combined with account-level blocks after just a few rapid requests.

**How to avoid:**
- Use `stealth-plugin` for Playwright (patches navigator.webdriver, removes automation indicators)
- Rotate residential proxy pools (never datacenter IPs for Google Maps)
- Randomize request timing with human-like delays (exponential backoff, not uniform)
- Rotate User-Agent strings across real browser versions
- For Google Maps specifically: use the unofficial Google Maps API via SerpAPI or similar paid service instead of raw scraping — avoids the detection arms race entirely
- Session-based access tokens (Facebook/Instagram) rather than anonymous scraping

**Warning signs:**
- First scrape succeeds, second fails with CAPTCHAs
- Google Maps returns "unusual traffic" warning pages
- Instagram returns 429 rate limit after 10-20 requests
- Facebook returns empty page arrays where business data should exist
- Proxy rotation immediately improves results (confirms detection is IP-based)

**Phase to address:**
Phase 1 (Scraping Infrastructure) — This must be solved before any generation can happen. The pipeline is useless if it can't get data.

---

### Pitfall 2: Hugo Build Bottlenecks at 100+ Sites/Week

**What goes wrong:**
Hugo builds start taking 5-10 seconds per site as the project accumulates content. At 100 sites/week, the build queue backs up. Total generation time exceeds the 10-minute SLA (PIPELINE-03). Or Hugo runs out of memory on large content sets.

**Why it happens:**
Hugo's strength is single-site speed, but running hundreds of parallel Hugo builds competes for CPU/memory. Each site has its own `hugo new site` initialization which clones themes and configuration. Image processing (Hugo's image conversion) is CPU-bound. The common mistake is running Hugo in watch mode unnecessarily or not using Hugo's built-in parallelization flags (`--parallel`).

**How to avoid:**
- Use `hugo --quiet` to reduce log overhead
- Pre-build a base theme/theme override bundle to avoid theme cloning per site
- Use `hugo --cacheDir` for shared content cache across builds
- For truly high volume, consider a template-based HTML generator instead of Hugo (pure string substitution is faster than Hugo's parsing for simple landing pages)
- Monitor build times per site; set alerting at >3s per site

**Warning signs:**
- Build times creeping from 500ms to 3s over first week
- Memory usage spikes during parallel builds
- `hugo` process taking >10% CPU continuously

**Phase to address:**
Phase 1 (Preview Pipeline) — Must establish baseline build times and SLAs before scaling volume.

---

### Pitfall 3: AI Content Selection Choosing Low-Quality or Off-Brand Social Posts

**What goes wrong:**
The generated landing page features an Instagram post where the business owner is tagged in someone else's party photo, or a Yelp review that says "food was cold, delivery was late." The business owner sees their own website embarrassing them and immediately dismisses the product.

**Why it happens:**
AI engagement scoring (likes + comments + shares) doesn't account for: brand appropriateness (is this post on-brand?), content quality (is this a professional photo or a blurry party pic?), recency (old posts may not reflect current business state), or sentiment (high engagement ≠ positive sentiment about the business). The algorithm optimizes for engagement, not for "makes the business look good."

**How to avoid:**
- Build a content quality classifier before engagement scoring: reject posts with: no business tagged, excessive hashtags, Reels/memes, user-tagged photos, posts older than 12 months
- Implement manual override / preview step before auto-publishing — business owner can deselect any post
- Separate "engagement" signal from "quality" signal; use engagement only as tiebreaker among already-qualified content
- Add business category awareness: a dentist's office should feature clinical cleanliness photos, not birthday party photos

**Warning signs:**
- Generated sites featuring blurry or irrelevant images
- Business owners complaining "that's not my business" about featured content
- Posts selected from personal (not business) accounts

**Phase to address:**
Phase 2 (AI Generation) — Content selection logic must be built alongside generation prompts.

---

### Pitfall 4: TOTP 2FA Implementation Allowing Common Bypass Vectors

**What goes wrong:**
TOTP 2FA is implemented but allows bypass via: backup codes stored insecurely, no rate limiting on verification attempts (allowing brute force of 6-digit codes), tokens bound to wrong issuer (user sees wrong name in authenticator app and thinks it's broken), or TOTP secret exposed in URLs/Logs. Account takeover still possible.

**Why it happens:**
Developers treat TOTP as a black box from an auth library without understanding the attack surface. Common mistakes: using `totp.verify()` without `window` parameter (allows 1-2 step clock drift tolerance abuse), not rate-limiting verification endpoint (6-digit = 1M possibilities, easily brute forced at 1000/sec), storing TOTP secrets in plaintext or logging them, not enforcing TOTP on password change.

**How to avoid:**
- Use a well-audited library (OTPLess, speakeasy) — don't roll your own TOTP)
- Always set `window: 1` (allows ±1 step tolerance) but rate-limit verification to 5 attempts per minute
- Store TOTP secrets encrypted at rest, never in logs or URLs
- On enrollment, show QR code and verify the user can successfully authenticate BEFORE saving the secret
- Implement account lockout (not just code expiry) after 10 failed attempts
- Bind issuer to business name: `otpauth://totp/{businessName}:{email}` so authenticator app shows recognizable name

**Warning signs:**
- Users reporting "code doesn't work even though I just generated it"
- No rate limiting headers on `/verify-2fa` endpoint
- TOTP secrets appearing in server logs

**Phase to address:**
Phase 3 (Production Auth) — Security-critical path must be audited before launch.

---

### Pitfall 5: Multi-Tenant Isolation Failures (Data Bleed Between Business Sites)

**What goes wrong:**
Business A's Gatsby/Next.js instance can read Business B's customer data from shared CDN cache, or a malicious business owner can access another business's site via path traversal. Production sites are served from shared infrastructure without proper namespace isolation. CSS/JavaScript from one business's site leaks into another's preview.

**Why it happens:**
The distinction between preview (S3 + Cloudflare) and production (Next.js + CDN) architectures blurs. Next.js serving from a shared cluster with incorrect `x-tenant-id` headers allows cache poisoning. S3 bucket policies are too permissive (allowing public read of all business assets). Or the database uses shared tables without row-level security.

**How to avoid:**
- Each production business site must have isolated CDN origin (separate Cloudflare zone or path-based isolation with strict cache keys including tenant ID)
- S3: one bucket per business with explicit deny-not-principal policies
- Next.js: use tenant context middleware that validates tenant ID from JWT matches requested resource — never trust client-supplied tenant ID
- Implement Subresource Integrity (SRI) for any embedded scripts
- Regular "cross-tenant access" penetration tests

**Warning signs:**
- Shared CSS variables bleeding between business previews
- URL guessing (incrementing business IDs) returns other business's data
- No tenant isolation tests in test suite

**Phase to address:**
Phase 3 (Production Infrastructure) — Isolation must be architected in, not retrofitted.

---

### Pitfall 6: Custom Domain DNS/SSL Provisioning Blocking on Port 80

**What goes wrong:**
Business owner follows DNS instructions but site never goes live. Common causes: Let's Encrypt HTTP01 challenge fails because port 80 is blocked by their hosting provider, Cloudflare Origin CA requires full DNS migration (not just CNAME), or DNS TTL propagation delays cause SSL provisioning to timeout during onboarding.

**Why it happens:**
Business owners often have websites hosted at Wix/Squarespace that block port 80/443 for third-party CNAME records. The "add a CNAME record" instruction assumes port 80 is available. Cloudflare's "full setup" requirement for Origin CA certificates is not explained. DNS changes take time and users refresh before TTL expires.

**How to avoid:**
- Support ALPN challenges (TLS-ALPN-01) for Let's Encrypt — doesn't require port 80
- Pre-validate DNS before claiming the domain: check CNAME exists and points to correct target before initiating SSL provisioning
- Show "DNS propagation status" in onboarding UI (use dig against multiple global resolvers)
- Use Cloudflare's "Cloudflare for SaaS" product which handles SSL at the edge without requiring DNS migration
- Set DNS TTL to 300s before making changes, restore after verification

**Warning signs:**
- SSL provisioning step hanging >5 minutes
- Business owner reports "I added the DNS record but nothing happened"
- Let's Encrypt rate limit errors from repeated failed attempts

**Phase to address:**
Phase 3 (DNS/SSL Infrastructure) — Must be tested with real domain registrars before launch.

---

### Pitfall 7: WYSIWYG Editor Producing Invalid HTML That Breaks When Saved

**What goes wrong:**
Business owner pastes content from Word/Google Docs into Tiptap editor. The resulting HTML contains: nested lists (`<ul><ul>` instead of `<ul><li>`), inline styles from Word (`<span style="mso-list:ignore">`), messy table markup, and font tags. When rendered on the Hugo/static side, the page breaks. Or the inverse: Tiptap outputs schema that Hugo's Goldmark renderer rejects.

**Why it happens:**
Rich text editors sanitize aggressively but not perfectly. Word HTML is notoriously malformed. Tiptap's output is designed for web rendering, not static site generators. The generated landing pages (Hugo) use a different HTML subset than what Tiptap produces. Non-technical users don't know that "paste as plain text" exists.

**How to avoid:**
- Use Tiptap's `pastePlugin` with `keepOnlyPlainText: false` but aggressive cleanup rules
- Add a pre-save validation step that runs Tiptap output through DOMPurify and validates against Hugo's Goldmark-compatible HTML subset
- Strip all `class` attributes on save (Tiptap generates UUID classes that mean nothing in Hugo output)
- Provide a "paste from Word" button that routes through turndown (Markdown converter) before inserting
- Test the full round-trip: paste → save → render → inspect before launch

**Warning signs:**
- Generated sites showing "lost" formatting when viewed
- Console errors from Goldmark parsing invalid HTML
- Images with broken src attributes after editor save

**Phase to address:**
Phase 2 (Production Editor) — Editor integration with static generation must be tested end-to-end early.

---

### Pitfall 8: Headless Browser Scraping Completes But Data Is Stale or Empty

**What goes wrong:**
Scraping runs successfully (no blocks, no errors) but returns: 0 reviews because the page requires scrolling (lazy loading), only 3 Instagram posts because the API returns paginated results, or Google Maps returns "No results found" because the search query is slightly wrong. The pipeline proceeds with empty data and generates useless landing pages.

**Why it happens:**
Lazy loading is the primary culprit. Google Maps, Instagram, and Facebook all load content dynamically via infinite scroll or "Load More" buttons. A headless browser that loads the page and immediately reads DOM gets the empty skeleton, not the loaded content. Without scrolling simulation and explicit wait for networkidle, you get nothing. Additionally, search queries that work in a browser may fail programmatically due to geolocation differences.

**How to avoid:**
- Implement scroll simulation: `await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))` followed by `await page.waitForNetworkIdle()`
- For Google Maps: scroll through all "More places" expanders
- For Instagram: scroll through posts grid and click "Load more"
- Validate minimum data thresholds before proceeding: if Google Maps returns <3 results, flag for manual review
- Add retry logic with different search query variations if first attempt returns empty
- Use `page.setGeolocation()` to match the business's actual coordinates

**Warning signs:**
- Scraping completes but all result arrays are empty or near-empty
- Logs show "NetworkIdle reached" but DOM inspection shows loading skeletons
- Data variance between test runs (some succeed, most fail)

**Phase to address:**
Phase 1 (Scraping Infrastructure) — Data validation gates must exist before generation triggers.

---

### Pitfall 9: AI Generation Prompts Leaking Business Data to Model Provider

**What goes wrong:**
Scraped business data (reviews, social posts, personal photos) is sent to OpenAI/Anthropic API for generation. This may violate: the business data's privacy rights (reviews are copyrighted content), platform Terms of Service (Instagram/Facebook review data), and GDPR if the business owner is EU-based. The company has no data processing agreement with the LLM provider for this specific use case.

**Why it happens:**
Developers assume "we have permission because the business owner agreed to our Terms" without checking if the content sources (Yelp reviews, Instagram posts from other users) have their own IP and privacy rights. The scraped content is a derivative work when used for AI training or even for generation. No DPA exists with the LLM provider covering this data category.

**How to avoid:**
- Never send raw scraped content (especially user-generated content like reviews) to LLM APIs — summarize locally first
- Use local models or fine-tuned open-source models (Llama via Ollama) for content extraction/summarization
- If using OpenAI/Anthropic: ensure your DPA covers "user content processing" and the business has consented to AI generation from their social data
- Scrape in read-only mode; don't store full post content, only metadata + extracted summaries
- Consult a privacy lawyer before launch if processing EU business data

**Warning signs:**
- No data processing agreement with LLM provider
- Raw review text appearing in prompt logs
- Terms of Service that don't explicitly cover AI generation from third-party social content

**Phase to address:**
Phase 2 (AI Generation) — Legal/compliance review of data flow must precede launch.

---

### Pitfall 10: Preview URL System Being Used as Production Site (Security + Economics)

**What goes wrong:**
Sales agents start sharing preview URLs (`biz-{hash}.preview.siteforge.io`) as permanent links to businesses. Preview infrastructure (S3 + Cloudflare free tier) was designed for temporary cold outreach, not ongoing production traffic. The free tier gets exhausted, or worse, the preview URL becomes the de facto production site with no 2FA, no custom domain, and no editor — because it's "good enough."

**Why it happens:**
The two-tier architecture (preview vs production) is confusing internally. Sales agents optimize for speed (preview is instantly generated) over quality (production requires onboarding). Preview URLs are easy to share; production onboarding takes days. The result: sensitive business data exposed via publicly accessible preview URLs that have no access control.

**How to avoid:**
- Implement mandatory conversion flow: preview URLs expire after 30 days with prominent "upgrade to keep your site" messaging
- Add IP-based rate limiting to preview URLs to prevent them becoming high-traffic production replacements
- Track preview URL traffic in the dashboard; spike in preview traffic = sales team working around the system
- Design preview to feel "obviously temporary" — watermark, no custom domain option, 2-day expiry in UI
- Make production onboarding faster (target: <10 minutes) so there's no incentive to skip it

**Warning signs:**
- Preview domain getting >10k visitors/month (should be near zero — they're cold outreach links)
- Sales team requesting "more permanent" preview URLs
- Businesses responding "just use that link" when asked to subscribe

**Phase to address:**
Phase 1 (Preview/Landing System) — Business logic to force conversion must be built-in from day one.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Use datacenter proxies instead of residential for Google Maps | 10x cheaper | Immediate IP bans, entire pipeline fails | Never — this is a core dependency |
| Skip TOTP enrollment flow testing | Faster auth implementation | Users can't enroll, support tickets flood in | Never |
| Hard-code business categories instead of config | Faster to ship | Adding categories requires code deploy | Only for MVP with explicit deprecation plan |
| Single S3 bucket with key prefixes instead of per-business buckets | Simpler infra | Cross-tenant data access risk | Never for production; acceptable for preview |
| Use `innerHTML` instead of sanitized DOM for editor output | Simpler implementation | XSS vulnerability | Never |
| Skip image processing (resize/optimize) | Faster pipeline | Bandwidth costs explode, pages load slowly | Only for MVP thumbnails |
| Skip SSL certificate renewal monitoring | Fewer alerts to manage | Certificates expire, sites go dark | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google Maps (SerpAPI) | Using free tier; hits rate limits immediately | Paid tier with proper request spacing; cache aggressively |
| Instagram Basic Display API | Token expires after 60 days; no refresh flow | Use Long-Lived Access Tokens with automatic refresh; monitor expiry |
| Facebook Graph API | Version deprecation; v12 works today, broken in 6 months | Pin to API version in config; automate version testing |
| Yelp Fusion API | 3-month rolling reviews only; missing older content | Supplement with direct scrape for full review history |
| Let's Encrypt | Rate limit on duplicate certificates (5 per week per domain) | Use staging environment for testing; don't re-provision same domain |
| Cloudflare Origin CA | Certificate tied to Cloudflare account; can't transfer | Use Let's Encrypt or Cloudflare for SaaS if you might leave Cloudflare |
| Tiptap editor | Output schema changes between minor versions | Pin editor version; test round-trip with every update |
| Hugo | Version differences in Goldmark parser; HTML works in v1 but not v2 | Pin Hugo version in build environment; test output validation |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Hugo builds without caching | Each build re-downloads remote resources | Use `--cacheDir` and preload fonts/images at build time | At 50+ sites/day |
| Parallel Playwright scrapes without connection pooling | Memory exhaustion, "too many open files" | Pool browser contexts; max 5 concurrent per proxy | At 20+ concurrent scrapes |
| Tiptap editor storing full undo history | Database bloat; slow page loads | Limit undo stack to 50 operations; prune on save | At 100+ edits per site |
| No CDN for preview assets | Origin S3 gets hammered; latency spikes | Cloudflare caching with appropriate Cache-Control headers | At 1000+ preview views/day |
| AI generation without batch queuing | Token costs explode; rate limiting kicks in | Queue generation requests; process in batches during off-peak | At 10+ concurrent generation requests |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing TOTP secrets in plaintext or logs | Full 2FA bypass if logs leaked | Encrypted at rest (AES-256); zero logging of secrets |
| Not rate-limiting `/verify-2fa` endpoint | Brute force of 6-digit code (1M combos at 1000/sec = 17 min) | 5 attempt limit per minute per account; exponential backoff |
| Using predictable business ID sequences | Enumeration attack: `biz-123`, `biz-124` work | Use cryptographically random IDs (UUID v4); validate ownership on every request |
| Allowing arbitrary file uploads without type validation | Malicious uploads to S3 bucket | Whitelist MIME types; scan uploads with ClamAV; store outside web root |
| Sharing Cloudflare API keys across environments | Production config exposed if dev keys leaked | Environment-specific API keys; least-privilege IAM roles |
| Not encrypting S3 objects at rest | Data breach if bucket policy misconfigured | `SSE-S3` or `SSE-KMS` on all business assets |
| Webhook payloads not validated | Fake webhook triggers paid conversion | Verify webhook signatures (HMAC); validate payload schema |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| "Paste from Word" produces garbled output | User blames the product, not Word | Prominent "Paste as plain text" button with tooltip explaining why |
| 2FA enrollment shows QR code without testing | User sets up 2FA, then can't log in, calls support | Force a test verification before completing enrollment |
| Preview URL shares without conversion urgency | Business owner "just uses the free link" forever | Clear "This site expires in 30 days" banner; easy upgrade path |
| DNS instructions use registrar jargon ("CNAME record") | Business owner can't follow setup, abandons | Step-by-step visual guide per major registrar (GoDaddy, Namecheap, Google Domains) |
| Editor on mobile produces layout breaks on desktop | "Your site looks broken" complaints | Responsive preview in editor; desktop/mobile toggle; limit mobile editing to text only |
| Generated content uses business jargon ("We specialize in B2B SaaS") | Site doesn't feel personal | AI prompt should include tone calibration; offer "regenerate" option prominently |

---

## "Looks Done But Isn't" Checklist

- [ ] **Scraping:** Pipeline returns results → Check: Does it return results for 10 consecutive businesses, or just the first one?
- [ ] **Google Maps:** Page loads successfully → Check: Are reviews actually in the DOM, or loading skeletons?
- [ ] **Hugo builds:** Site generates → Check: Does it generate in <5 seconds at 100th site, or just the first one?
- [ ] **TOTP enrollment:** User can scan QR code → Check: Does the code actually verify successfully before the secret is saved?
- [ ] **2FA verification:** Code accepted → Check: Is rate limiting enforced, or can you brute force unlimited times?
- [ ] **SSL provisioning:** Certificate issued → Check: Does it actually renew automatically, or does it expire and go dark?
- [ ] **Multi-tenant isolation:** Sites render correctly → Check: Can Business A access Business B's data via direct URL manipulation?
- [ ] **Content selection:** High-engagement posts selected → Check: Are selected posts actually on-brand, or just high-engagement?
- [ ] **DNS setup:** CNAME record added → Check: Does SSL provision successfully, or does it hang due to port 80 block?
- [ ] **Preview URL:** Link shares and loads → Check: Does the preview expire after 30 days, or does it stay live indefinitely?

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| IP banned during scraping | MEDIUM | Rotate to fresh residential proxies; implement exponential backoff; switch to SerpAPI for Google Maps |
| Hugo build timeout | LOW | Increase build timeout; reduce image processing; switch to simpler template engine for preview |
| TOTP bypass via brute force | CRITICAL (security) | Immediately rate-limit verification endpoint; audit logs for compromise; force re-enrollment |
| Cross-tenant data access | CRITICAL (security + legal) | Isolate affected tenants; incident disclosure; full security audit |
| SSL certificate expiry | MEDIUM | Re-provision via Let's Encrypt (if rate limit not hit); switch to Cloudflare Origin CA |
| Preview URL becoming production | HIGH (business model) | Enforce expiration; migrate traffic to production; implement rate limiting |
| AI generates defamatory content | CRITICAL (legal + reputational) | Immediate content review pipeline; human-in-the-loop for high-risk content; content filters |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Headless browser detection | Phase 1: Scraping Infrastructure | Test scraping 50 businesses; none should return empty data |
| Hugo build bottlenecks | Phase 1: Preview Pipeline | Benchmark 100 sequential builds; all must complete in <5s |
| Low-quality AI content selection | Phase 2: AI Generation | Manual review of 20 generated sites for content appropriateness |
| TOTP bypass vectors | Phase 3: Production Auth | Security audit; penetration test with brute force attempt |
| Multi-tenant isolation failure | Phase 3: Production Infrastructure | Cross-tenant access test; all resources must be isolated |
| DNS/SSL blocking | Phase 3: DNS/SSL Infrastructure | Test with 3 real domain registrars; verify automated provisioning works |
| WYSIWYG invalid HTML | Phase 2: Production Editor | Round-trip test: paste → save → render → validate |
| Scraping returns stale/empty data | Phase 1: Scraping Infrastructure | Data validation gates; minimum thresholds before generation |
| AI data leakage to LLM provider | Phase 2: AI Generation | Legal review; data flow audit; no raw user content to APIs |
| Preview URL as production | Phase 1: Preview System | Expiration enforcement; traffic monitoring; conversion funnel |

---

## Sources

- **LOW confidence** — All findings based on training data, not verified via Context7, official documentation, or web searches due to environment restrictions.
- Google Maps scraping: Known bot detection patterns from general web scraping community
- Instagram/Facebook scraping: Platform API limitations documented in Graph API changelogs
- Hugo performance: General static site generator performance characteristics
- TOTP security: OWASP cheatsheet on TOTP, common implementation mistakes from auth library issues
- Multi-tenant isolation: Standard SaaS security patterns, known cloud misconfiguration incidents
- All findings require validation with current (2025-2026) sources before use in roadmap decisions.

---

*Pitfalls research for: SiteForge AI Website Generation Platform*
*Researched: 2026-03-23*
*Confidence: LOW — Verification unavailable*
