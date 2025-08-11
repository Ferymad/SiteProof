-- Data Association Validation Script
-- Validates that all data has proper company associations after Migration 006 fix
-- Use this to verify the production blocker has been resolved

-- Validation Query 1: Check all tables for orphaned records
SELECT 
    'companies' as table_name,
    COUNT(*) as total_records,
    COUNT(id) as records_with_id,
    0 as orphaned_records
FROM companies
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as total_records,
    COUNT(company_id) as records_with_company_id,
    COUNT(*) - COUNT(company_id) as orphaned_records
FROM users
UNION ALL
SELECT 
    'whatsapp_submissions' as table_name,
    COUNT(*) as total_records,
    COUNT(company_id) as records_with_company_id,
    COUNT(*) - COUNT(company_id) as orphaned_records
FROM whatsapp_submissions
UNION ALL
SELECT 
    'processing_analytics' as table_name,
    COUNT(*) as total_records,
    COUNT(company_id) as records_with_company_id,
    COUNT(*) - COUNT(company_id) as orphaned_records
FROM processing_analytics
UNION ALL
SELECT 
    'audit_logs' as table_name,
    COUNT(*) as total_records,
    COUNT(company_id) as records_with_company_id,
    COUNT(*) - COUNT(company_id) as orphaned_records
FROM audit_logs
UNION ALL
SELECT 
    'security_alerts' as table_name,
    COUNT(*) as total_records,
    COUNT(company_id) as records_with_company_id,
    COUNT(*) - COUNT(company_id) as orphaned_records
FROM security_alerts
ORDER BY table_name;

-- Validation Query 2: Check for invalid company references
SELECT 
    'Invalid company references' as validation_type,
    COUNT(*) as issue_count
FROM (
    SELECT company_id FROM users WHERE company_id NOT IN (SELECT id FROM companies)
    UNION ALL
    SELECT company_id FROM whatsapp_submissions WHERE company_id NOT IN (SELECT id FROM companies)
    UNION ALL
    SELECT company_id FROM processing_analytics WHERE company_id NOT IN (SELECT id FROM companies)
    UNION ALL
    SELECT company_id FROM audit_logs WHERE company_id NOT IN (SELECT id FROM companies)
    UNION ALL
    SELECT company_id FROM security_alerts WHERE company_id NOT IN (SELECT id FROM companies)
) invalid_refs;

-- Validation Query 3: Check processing_analytics to submission relationships
SELECT 
    'processing_analytics_orphaned' as validation_type,
    COUNT(*) as issue_count
FROM processing_analytics pa
WHERE pa.submission_id IS NOT NULL 
  AND pa.submission_id NOT IN (SELECT id FROM whatsapp_submissions);

-- Validation Query 4: Check company_id consistency between submissions and analytics
SELECT 
    'company_id_mismatch' as validation_type,
    COUNT(*) as issue_count
FROM processing_analytics pa
JOIN whatsapp_submissions ws ON ws.id = pa.submission_id
WHERE pa.company_id != ws.company_id;

-- Validation Query 5: Summary report
DO $$
DECLARE
    total_issues INTEGER := 0;
    orphaned_submissions INTEGER;
    orphaned_analytics INTEGER;
    orphaned_users INTEGER;
    invalid_refs INTEGER;
    company_mismatches INTEGER;
BEGIN
    -- Count issues
    SELECT COUNT(*) - COUNT(company_id) INTO orphaned_submissions FROM whatsapp_submissions;
    SELECT COUNT(*) - COUNT(company_id) INTO orphaned_analytics FROM processing_analytics;
    SELECT COUNT(*) - COUNT(company_id) INTO orphaned_users FROM users;
    
    -- Count invalid references
    SELECT COUNT(*) INTO invalid_refs FROM (
        SELECT company_id FROM users WHERE company_id NOT IN (SELECT id FROM companies)
        UNION ALL
        SELECT company_id FROM whatsapp_submissions WHERE company_id NOT IN (SELECT id FROM companies)
        UNION ALL
        SELECT company_id FROM processing_analytics WHERE company_id NOT IN (SELECT id FROM companies)
    ) invalid_refs;
    
    -- Count company_id mismatches
    SELECT COUNT(*) INTO company_mismatches
    FROM processing_analytics pa
    JOIN whatsapp_submissions ws ON ws.id = pa.submission_id
    WHERE pa.company_id != ws.company_id;
    
    total_issues := orphaned_submissions + orphaned_analytics + orphaned_users + invalid_refs + company_mismatches;
    
    RAISE NOTICE '=== DATA VALIDATION SUMMARY ===';
    RAISE NOTICE 'Orphaned Submissions: %', orphaned_submissions;
    RAISE NOTICE 'Orphaned Analytics: %', orphaned_analytics;
    RAISE NOTICE 'Orphaned Users: %', orphaned_users;
    RAISE NOTICE 'Invalid Company References: %', invalid_refs;
    RAISE NOTICE 'Company ID Mismatches: %', company_mismatches;
    RAISE NOTICE 'TOTAL ISSUES: %', total_issues;
    
    IF total_issues = 0 THEN
        RAISE NOTICE 'SUCCESS: All data associations are valid!';
        RAISE NOTICE 'Production blocker has been resolved.';
    ELSE
        RAISE NOTICE 'WARNING: % data issues remain. Production blocker not fully resolved.', total_issues;
    END IF;
END $$;

-- Final check: Verify RLS policies are working
-- This should be run by a test user to ensure they can only see their company's data
-- SELECT COUNT(*) FROM whatsapp_submissions; -- Should only show user's company data
-- SELECT COUNT(*) FROM processing_analytics;  -- Should only show user's company data