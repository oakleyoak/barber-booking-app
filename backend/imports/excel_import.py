import pandas as pd
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_db, create_tables
from app.crud import create_booking
from app.schemas import BookingCreate

def parse_excel_datetime(date_str, time_str):
    """Parse date and time strings from Excel into datetime objects"""
    try:
        # Handle various date formats
        if isinstance(date_str, str):
            # Try common date formats
            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S']:
                try:
                    date_obj = datetime.strptime(date_str, fmt).date()
                    break
                except ValueError:
                    continue
            else:
                raise ValueError(f"Could not parse date: {date_str}")
        else:
            # Assume it's already a date object or pandas datetime
            date_obj = pd.to_datetime(date_str).date()
        
        # Handle time
        if isinstance(time_str, str):
            # Parse time string (e.g., "14:30", "2:30 PM")
            time_str = time_str.strip()
            if 'AM' in time_str.upper() or 'PM' in time_str.upper():
                time_obj = datetime.strptime(time_str, '%I:%M %p').time()
            else:
                time_obj = datetime.strptime(time_str, '%H:%M').time()
        else:
            # Assume it's already a time object or pandas datetime
            time_obj = pd.to_datetime(time_str).time()
        
        return datetime.combine(date_obj, time_obj)
    
    except Exception as e:
        print(f"Error parsing date/time: {date_str}, {time_str} - {e}")
        return None

def import_from_excel(excel_path: str, sheet_name: str = None):
    """Import bookings from Excel file"""
    
    if not Path(excel_path).exists():
        print(f"Excel file not found: {excel_path}")
        return False
    
    try:
        # Read Excel file
        if sheet_name:
            df = pd.read_excel(excel_path, sheet_name=sheet_name)
        else:
            df = pd.read_excel(excel_path)
        
        print(f"Found {len(df)} rows in Excel file")
        print("Columns:", df.columns.tolist())
        
        # Create database tables
        create_tables()
        
        # Get database session
        db_gen = get_db()
        db = next(db_gen)
        
        imported_count = 0
        errors = []
        
        # Expected column mappings (adjust based on your Excel structure)
        # You may need to modify these column names to match your Excel file
        column_mappings = {
            'client_name': ['client', 'client_name', 'name', 'customer'],
            'date': ['date', 'booking_date', 'appointment_date'],
            'start_time': ['start_time', 'start', 'time', 'appointment_time'],
            'end_time': ['end_time', 'end', 'duration', 'finish_time'],
            'price': ['price', 'cost', 'fee', 'amount', 'charge'],
            'notes': ['notes', 'description', 'comments', 'details'],
            'location': ['location', 'venue', 'address', 'place'],
            'status': ['status', 'state', 'booking_status']
        }
        
        # Find actual column names
        actual_columns = {}
        for field, possible_names in column_mappings.items():
            for col in df.columns:
                if col.lower().strip() in [name.lower() for name in possible_names]:
                    actual_columns[field] = col
                    break
        
        print("Mapped columns:", actual_columns)
        
        for index, row in df.iterrows():
            try:
                # Extract data with fallbacks
                client_name = str(row.get(actual_columns.get('client_name', ''), f'Client_{index}')).strip()
                
                # Handle date and time parsing
                date_col = actual_columns.get('date')
                start_time_col = actual_columns.get('start_time')
                end_time_col = actual_columns.get('end_time')
                
                if date_col and start_time_col:
                    start_datetime = parse_excel_datetime(row[date_col], row[start_time_col])
                    if not start_datetime:
                        continue
                    
                    # Handle end time
                    if end_time_col and pd.notna(row.get(end_time_col)):
                        end_datetime = parse_excel_datetime(row[date_col], row[end_time_col])
                    else:
                        # Default to 1 hour duration if no end time
                        end_datetime = start_datetime + timedelta(hours=1)
                else:
                    print(f"Row {index}: Missing required date/time columns")
                    continue
                
                # Extract other fields
                price = float(row.get(actual_columns.get('price', ''), 0) or 0)
                notes = str(row.get(actual_columns.get('notes', ''), '')).strip() or None
                location = str(row.get(actual_columns.get('location', ''), '')).strip() or None
                status = str(row.get(actual_columns.get('status', ''), 'confirmed')).strip() or 'confirmed'
                
                # Create booking
                booking_data = BookingCreate(
                    client_name=client_name,
                    start_time=start_datetime,
                    end_time=end_datetime,
                    price=price,
                    notes=notes,
                    location=location,
                    status=status
                )
                
                create_booking(db, booking_data)
                imported_count += 1
                print(f"Imported booking {imported_count}: {client_name} at {start_datetime}")
                
            except Exception as e:
                error_msg = f"Row {index}: {str(e)}"
                errors.append(error_msg)
                print(f"Error importing row {index}: {e}")
                continue
        
        db.close()
        
        print(f"\nImport completed!")
        print(f"Successfully imported: {imported_count} bookings")
        print(f"Errors: {len(errors)}")
        
        if errors:
            print("\nError details:")
            for error in errors[:10]:  # Show first 10 errors
                print(f"  - {error}")
        
        return True
        
    except Exception as e:
        print(f"Failed to import Excel file: {e}")
        return False

if __name__ == "__main__":
    # Example usage
    excel_file = "../../data/Bookings_sheet 5 weeks.xlsx"
    
    print("Starting Excel import...")
    success = import_from_excel(excel_file)
    
    if success:
        print("Import completed successfully!")
    else:
        print("Import failed!")
        print("\nMake sure:")
        print("1. The Excel file exists at the specified path")
        print("2. The Excel file has the expected columns")
        print("3. The database is accessible")
        print("\nExpected columns (any of these names):")
        print("- Client: client, client_name, name, customer")
        print("- Date: date, booking_date, appointment_date")
        print("- Start Time: start_time, start, time, appointment_time")
        print("- End Time: end_time, end, duration, finish_time")
        print("- Price: price, cost, fee, amount, charge")
        print("- Notes: notes, description, comments, details")
        print("- Location: location, venue, address, place")
        print("- Status: status, state, booking_status")
