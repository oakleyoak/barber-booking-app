# Sample Excel Data Structure

This directory should contain your `Bookings_sheet 5 weeks.xlsx` file.

## Expected Excel Structure

The Excel import script expects columns with any of these names:

### Required Columns:
- **Client**: client, client_name, name, customer
- **Date**: date, booking_date, appointment_date  
- **Start Time**: start_time, start, time, appointment_time
- **Price**: price, cost, fee, amount, charge

### Optional Columns:
- **End Time**: end_time, end, duration, finish_time
- **Notes**: notes, description, comments, details
- **Location**: location, venue, address, place
- **Status**: status, state, booking_status

## Sample Data Format:

| Date       | Client Name | Start Time | End Time | Price | Location | Notes              | Status    |
|------------|-------------|------------|----------|-------|----------|--------------------|-----------|
| 2024-01-15 | John Smith  | 09:00      | 10:00    | 75.00 | Studio A | Regular session    | confirmed |
| 2024-01-15 | Jane Doe    | 14:30      | 15:30    | 85.00 | Online   | Virtual meeting    | confirmed |
| 2024-01-16 | Bob Wilson  | 11:00      | 12:30    | 120.00| Studio B | Extended session   | pending   |

## To Import Data:

1. Place your Excel file in this directory
2. Run the import script from the backend directory:
   ```bash
   cd backend
   python imports/excel_import.py
   ```

The import script will automatically detect column names and convert the data to the appropriate format for the database.
