-------------
| table_name           | total_records | records_with_company_id | orphaned_records |
| -------------------- | ------------- | ----------------------- | ---------------- |
| whatsapp_submissions | 24            | 0                       | 24               |
| processing_analytics | 0             | 0                       | 0                |
| users                | 0             | 0                       | 0                |
---------------
| id                                   | name                  | type            | subscription_tier | created_at                    |
| ------------------------------------ | --------------------- | --------------- | ----------------- | ----------------------------- |
| 9b50da23-21d7-48be-98f9-4e892de1cf83 | BMAD Construction Ltd | main_contractor | trial             | 2025-08-11 15:53:08.277456+00 |
| 9d55f78c-908e-45f8-b61b-5ba07e44ceb4 | Test Subcontractor    | subcontractor   | trial             | 2025-08-11 15:53:08.277456+00 |
---------------------------
| company_name          | company_type    | user_count | submissions_count | analytics_count |
| --------------------- | --------------- | ---------- | ----------------- | --------------- |
| BMAD Construction Ltd | main_contractor | 0          | 0                 | 0               |
| Test Subcontractor    | subcontractor   | 0          | 0                 | 0               |
------------------------------
    ERROR:  42601: syntax error at or near "data"
LINE 2:   data for authenticated user's company
          ^
          ------------------------------------
| check_type       | status                                        |
| ---------------- | --------------------------------------------- |
| Migration Status | ✅ All core tables exist                       |
| Data Integrity   | ❌ Orphaned submissions remain                 |
| Company Data     | ✅ 2 companies exist                           |
| Submission Data  | ✅ 24 submissions with 
  company association |