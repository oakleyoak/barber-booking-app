-- =====================================================
-- Fix Paid but Scheduled Bookings
-- =====================================================
-- Purpose: Update bookings that are marked as 'paid' but still 'scheduled'
--          to 'completed' status (correct business logic)
-- 
-- Run this ONCE in Supabase SQL Editor after deploying the code fix
-- =====================================================

-- Step 1: Preview bookings that will be updated
SELECT 
  id,
  booking_date,
  customer_name,
  service_name,
  total_price,
  status,
  payment_status,
  payment_received_at
FROM bookings
WHERE payment_status = 'paid' 
  AND status = 'scheduled'
ORDER BY booking_date DESC;

-- Step 2: Show count of affected bookings
SELECT COUNT(*) as affected_bookings_count
FROM bookings
WHERE payment_status = 'paid' 
  AND status = 'scheduled';

-- Step 3: Update the bookings (run this after reviewing above)
UPDATE bookings
SET status = 'completed'
WHERE payment_status = 'paid' 
  AND status = 'scheduled';

-- Step 4: Verify the update
SELECT 
  COUNT(*) as completed_paid_bookings,
  SUM(total_price) as total_revenue
FROM bookings
WHERE payment_status = 'paid' 
  AND status = 'completed';

-- Step 5: Check if any remain stuck (should be 0)
SELECT COUNT(*) as remaining_stuck_bookings
FROM bookings
WHERE payment_status = 'paid' 
  AND status = 'scheduled';
