-- ===================================================================
-- BACKFILL MISSING CUSTOMER_IDS IN BOOKINGS TABLE
-- This script will match bookings to customers by name and update
-- the customer_id field for all NULL entries
-- ===================================================================

-- Step 1: Show current status
SELECT 
  COUNT(*) as total_bookings,
  COUNT(customer_id) as bookings_with_customer_id,
  COUNT(*) - COUNT(customer_id) as bookings_missing_customer_id
FROM bookings;

-- Step 2: Preview what will be updated (case-insensitive match)
SELECT 
  b.id as booking_id,
  b.customer_name as booking_customer_name,
  b.date as booking_date,
  b.customer_id as current_customer_id,
  c.id as matched_customer_id,
  c.name as matched_customer_name
FROM bookings b
LEFT JOIN customers c ON LOWER(TRIM(b.customer_name)) = LOWER(TRIM(c.name))
WHERE b.customer_id IS NULL
  AND c.id IS NOT NULL
ORDER BY b.date DESC
LIMIT 20;

-- Step 3: Count how many will be updated
SELECT COUNT(*) as will_be_updated
FROM bookings b
INNER JOIN customers c ON LOWER(TRIM(b.customer_name)) = LOWER(TRIM(c.name))
WHERE b.customer_id IS NULL;

-- Step 4: BACKUP - Create a backup of bookings before updating
CREATE TABLE IF NOT EXISTS bookings_backup_before_customer_id_fix AS 
SELECT * FROM bookings WHERE customer_id IS NULL;

-- Step 5: UPDATE - Backfill customer_ids (case-insensitive match)
-- This will match bookings to customers by name
UPDATE bookings b
SET customer_id = c.id,
    updated_at = NOW()
FROM customers c
WHERE LOWER(TRIM(b.customer_name)) = LOWER(TRIM(c.name))
  AND b.customer_id IS NULL;

-- Step 6: Show results
SELECT 
  COUNT(*) as total_bookings,
  COUNT(customer_id) as bookings_with_customer_id,
  COUNT(*) - COUNT(customer_id) as bookings_still_missing_customer_id
FROM bookings;

-- Step 7: Show bookings that still have NULL customer_id (these customers don't exist in customers table)
SELECT 
  customer_name,
  COUNT(*) as booking_count,
  MIN(date) as first_booking,
  MAX(date) as last_booking
FROM bookings
WHERE customer_id IS NULL
GROUP BY customer_name
ORDER BY booking_count DESC;

-- Step 8: OPTIONAL - Create missing customers for bookings that still have NULL customer_id
-- Uncomment the lines below to create customer records for people who don't exist yet

-- INSERT INTO customers (name, user_id, last_visit, created_at, updated_at)
-- SELECT DISTINCT 
--   b.customer_name,
--   b.user_id,
--   MAX(b.date) as last_visit,
--   NOW(),
--   NOW()
-- FROM bookings b
-- WHERE b.customer_id IS NULL
--   AND NOT EXISTS (
--     SELECT 1 FROM customers c 
--     WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(b.customer_name))
--   )
-- GROUP BY b.customer_name, b.user_id;

-- Step 9: OPTIONAL - Run the UPDATE again after creating missing customers
-- UPDATE bookings b
-- SET customer_id = c.id,
--     updated_at = NOW()
-- FROM customers c
-- WHERE LOWER(TRIM(b.customer_name)) = LOWER(TRIM(c.name))
--   AND b.customer_id IS NULL;

-- Step 10: Final verification
SELECT 
  'FINAL STATS' as report,
  COUNT(*) as total_bookings,
  COUNT(customer_id) as bookings_with_customer_id,
  COUNT(*) - COUNT(customer_id) as bookings_missing_customer_id,
  ROUND(COUNT(customer_id) * 100.0 / COUNT(*), 2) as percentage_complete
FROM bookings;
