import { describe, it, expect } from 'vitest';
import { withTenant } from './schema';
import { RLS_MIGRATIONS } from './rls';

describe('TenantMiddleware', () => {
  it('should export withTenant function', () => {
    expect(withTenant).toBeDefined();
    expect(typeof withTenant).toBe('function');
  });

  it('should export RLS_MIGRATIONS array', () => {
    expect(RLS_MIGRATIONS).toBeDefined();
    expect(Array.isArray(RLS_MIGRATIONS)).toBe(true);
    expect(RLS_MIGRATIONS.length).toBeGreaterThan(0);
  });

  it('should have tenant isolation policies in RLS_MIGRATIONS', () => {
    const policies = RLS_MIGRATIONS.filter(m => m.includes('CREATE POLICY'));
    expect(policies.length).toBeGreaterThanOrEqual(7);
  });
});
