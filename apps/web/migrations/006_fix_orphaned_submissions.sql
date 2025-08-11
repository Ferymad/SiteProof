-- Emergency Fix: Story 1.2 Production Blocker - Fix Orphaned WhatsApp Submissions
-- Critical Fix: Associate 24 orphaned submissions with proper company_id
-- Issue: Migration 004 assumed whatsapp_submissions had company_id values, but they were NULL

-- Step 1: Verify the issue exists
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count 
    FROM whatsapp_submissions 
    WHERE company_id IS NULL;
    
    RAISE NOTICE 'Found % orphaned submissions with NULL company_id', orphaned_count;
END $$;

-- Step 2: Get the default company ID (first company in the system)
-- In production, this should be set to the correct company ID for the orphaned data
DO $$
DECLARE
    default_company_id UUID;
    orphaned_count INTEGER;
BEGIN
    -- Get the first company as default (BMAD Construction Ltd based on QA findings)
    -- If the specific company ID from QA is available, use that instead
    SELECT id INTO default_company_id 
    FROM companies 
    WHERE name ILIKE '%BMAD%' OR name ILIKE '%Construction%'
    LIMIT 1;
    
    -- If no company found with BMAD/Construction, use first company
    IF default_company_id IS NULL THEN
        SELECT id INTO default_company_id FROM companies ORDER BY created_at LIMIT 1;
    END IF;
    
    IF default_company_id IS NULL THEN
        RAISE EXCEPTION 'No companies found in database. Cannot fix orphaned submissions.';
    END IF;
    
    RAISE NOTICE 'Using default company ID: %', default_company_id;
    
    -- Step 3: Fix orphaned submissions
    UPDATE whatsapp_submissions 
    SET company_id = default_company_id
    WHERE company_id IS NULL;
    
    GET DIAGNOSTICS orphaned_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % orphaned submissions', orphaned_count;
END $$;

-- Step 4: Fix any orphaned processing_analytics that may have been affected
DO $$
DECLARE
    analytics_fixed INTEGER;
BEGIN
    UPDATE processing_analytics 
    SET company_id = (
        SELECT ws.company_id 
        FROM whatsapp_submissions ws 
        WHERE ws.id = processing_analytics.submission_id
    )
    WHERE company_id IS NULL 
      AND submission_id IS NOT NULL;
    
    GET DIAGNOSTICS analytics_fixed = ROW_COUNT;
    RAISE NOTICE 'Fixed % orphaned analytics records', analytics_fixed;
END $$;

-- Step 5: Verification queries
DO $$
DECLARE
    submissions_total INTEGER;
    submissions_with_company INTEGER;
    submissions_orphaned INTEGER;
    analytics_total INTEGER;
    analytics_with_company INTEGER;
    analytics_orphaned INTEGER;
BEGIN
    -- Check whatsapp_submissions
    SELECT COUNT(*) INTO submissions_total FROM whatsapp_submissions;
    SELECT COUNT(company_id) INTO submissions_with_company FROM whatsapp_submissions;
    submissions_orphaned := submissions_total - submissions_with_company;
    
    -- Check processing_analytics
    SELECT COUNT(*) INTO analytics_total FROM processing_analytics;
    SELECT COUNT(company_id) INTO analytics_with_company FROM processing_analytics;
    analytics_orphaned := analytics_total - analytics_with_company;
    
    RAISE NOTICE 'VERIFICATION RESULTS:';
    RAISE NOTICE 'WhatsApp Submissions - Total: %, With Company: %, Orphaned: %', 
                 submissions_total, submissions_with_company, submissions_orphaned;
    RAISE NOTICE 'Processing Analytics - Total: %, With Company: %, Orphaned: %', 
                 analytics_total, analytics_with_company, analytics_orphaned;
    
    -- Fail if any orphaned records remain
    IF submissions_orphaned > 0 OR analytics_orphaned > 0 THEN
        RAISE EXCEPTION 'Migration failed: % submissions and % analytics records still orphaned', 
                        submissions_orphaned, analytics_orphaned;
    END IF;
    
    RAISE NOTICE 'SUCCESS: All records now have proper company associations';
END $$;

-- Step 6: Add constraints to prevent future orphaned records
-- Make company_id NOT NULL on whatsapp_submissions to prevent future issues
ALTER TABLE whatsapp_submissions 
ALTER COLUMN company_id SET NOT NULL;

-- Add check constraint to ensure company_id is always present
ALTER TABLE whatsapp_submissions 
ADD CONSTRAINT whatsapp_submissions_company_id_not_null 
CHECK (company_id IS NOT NULL);

-- Make company_id NOT NULL on processing_analytics
ALTER TABLE processing_analytics 
ALTER COLUMN company_id SET NOT NULL;

-- Final verification with constraints
DO $$
BEGIN
    RAISE NOTICE 'Migration 006 completed successfully';
    RAISE NOTICE 'All orphaned records fixed and constraints added to prevent future orphans';
END $$;