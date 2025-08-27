import requests
import json
from datetime import datetime, timedelta

# Test the booking management API
API_BASE = "http://localhost:8000"

def test_api():
    print("🧪 Testing Booking Management API...")
    
    # Test 1: Health check
    try:
        response = requests.get(f"{API_BASE}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print("❌ Health check failed")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API - make sure backend is running on port 8000")
        return False
    
    # Test 2: Get bookings (should be empty initially)
    response = requests.get(f"{API_BASE}/bookings/")
    if response.status_code == 200:
        bookings = response.json()
        print(f"✅ Get bookings: {len(bookings)} bookings found")
    else:
        print(f"❌ Get bookings failed: {response.status_code}")
        return False
    
    # Test 3: Create a test booking
    now = datetime.now()
    start_time = now.replace(hour=14, minute=0, second=0, microsecond=0)
    end_time = start_time + timedelta(hours=1)
    
    test_booking = {
        "client_name": "Test Client",
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "price": 75.00,
        "notes": "Test booking created by API test",
        "location": "Test Studio",
        "status": "confirmed"
    }
    
    response = requests.post(f"{API_BASE}/bookings/", json=test_booking)
    if response.status_code == 200:
        created_booking = response.json()
        booking_id = created_booking["id"]
        print(f"✅ Create booking: ID {booking_id}")
    else:
        print(f"❌ Create booking failed: {response.status_code}")
        print(response.text)
        return False
    
    # Test 4: Get the created booking
    response = requests.get(f"{API_BASE}/bookings/{booking_id}")
    if response.status_code == 200:
        booking = response.json()
        print(f"✅ Get booking by ID: {booking['client_name']}")
    else:
        print(f"❌ Get booking by ID failed: {response.status_code}")
        return False
    
    # Test 5: Update the booking
    update_data = {
        "price": 85.00,
        "notes": "Updated test booking"
    }
    
    response = requests.put(f"{API_BASE}/bookings/{booking_id}", json=update_data)
    if response.status_code == 200:
        updated_booking = response.json()
        print(f"✅ Update booking: Price updated to ${updated_booking['price']}")
    else:
        print(f"❌ Update booking failed: {response.status_code}")
        return False
    
    # Test 6: Get daily earnings
    today = datetime.now().date().isoformat()
    response = requests.get(f"{API_BASE}/earnings/daily/{today}")
    if response.status_code == 200:
        earnings = response.json()
        print(f"✅ Daily earnings: ${earnings['total_earnings']} from {earnings['booking_count']} bookings")
    else:
        print(f"❌ Daily earnings failed: {response.status_code}")
        return False
    
    # Test 7: Get weekly earnings
    response = requests.get(f"{API_BASE}/earnings/weekly/current")
    if response.status_code == 200:
        weekly = response.json()
        print(f"✅ Weekly earnings: ${weekly['total_earnings']} (avg: ${weekly['average_daily']:.2f}/day)")
    else:
        print(f"❌ Weekly earnings failed: {response.status_code}")
        return False
    
    # Test 8: Delete the test booking
    response = requests.delete(f"{API_BASE}/bookings/{booking_id}")
    if response.status_code == 200:
        print("✅ Delete booking: Test booking removed")
    else:
        print(f"❌ Delete booking failed: {response.status_code}")
        return False
    
    print("\n🎉 All API tests passed! The backend is working correctly.")
    print(f"\n📚 API Documentation: {API_BASE}/docs")
    return True

if __name__ == "__main__":
    test_api()
