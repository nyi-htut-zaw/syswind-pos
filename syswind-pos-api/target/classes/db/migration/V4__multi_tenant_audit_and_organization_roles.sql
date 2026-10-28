-- ====================================================================
-- Syswind V4: Multi-Tenant Scoping for Audit Logs and Roles
-- ====================================================================

-- 1. Add organization_id to audit_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Backfill audit_logs with user's organization or default organization
UPDATE audit_logs a
SET organization_id = u.organization_id
FROM users u
WHERE a.user_id = u.id AND a.organization_id IS NULL AND u.organization_id IS NOT NULL;

UPDATE audit_logs
SET organization_id = (SELECT id FROM organizations WHERE code = 'SYSWIND' LIMIT 1)
WHERE organization_id IS NULL;

-- 3. Backfill roles without organization_id to default organization SYSWIND
UPDATE roles
SET organization_id = (SELECT id FROM organizations WHERE code = 'SYSWIND' LIMIT 1)
WHERE organization_id IS NULL;

-- 4. Create performance indexes for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roles_org_system ON roles(organization_id, is_system, name);
CREATE INDEX IF NOT EXISTS idx_orders_org_created ON orders(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_org_active ON products(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_customers_org_phone ON customers(organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_deliveries_org_status ON deliveries(organization_id, delivery_status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_org_active ON payment_methods(organization_id, is_active, sort_order);
