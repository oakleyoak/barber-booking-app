# Database Schema

This folder contains SQL scripts for setting up the database schema for the booking app.

## Files

- `customers.sql` - Creates the customers table with the following structure:
  - `id` (UUID, auto-generated primary key)
  - `user_id` (UUID, nullable, foreign key to users table)
  - `name` (TEXT, required)
  - `email` (TEXT, nullable)
  - `phone` (TEXT, nullable)
  - `last_visit` (DATE, nullable)
  - `created_at` (TIMESTAMP WITH TIME ZONE, auto-generated)
  - `updated_at` (TIMESTAMP WITH TIME ZONE, auto-generated)

## Setup Instructions

1. Connect to your Supabase project
2. Run the SQL scripts in order
3. The `update_updated_at_column` function should already exist in your database

## Notes

- The schema has been simplified from the original version
- Visit tracking (total_visits, total_spent) is now handled through booking records
- Customer notes and preferred barber fields have been removed for simplicity
