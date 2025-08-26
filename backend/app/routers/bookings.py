from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.schemas import BookingResponse, BookingCreate, BookingUpdate
from app.crud import (
    get_booking, get_bookings, get_bookings_by_date_range,
    get_bookings_by_client, create_booking, update_booking, delete_booking
)

router = APIRouter(prefix="/bookings", tags=["bookings"])

@router.get("/", response_model=List[BookingResponse])
def read_bookings(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    client: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Get bookings with optional filtering"""
    if client:
        return get_bookings_by_client(db, client)
    elif start_date and end_date:
        return get_bookings_by_date_range(db, start_date, end_date)
    else:
        return get_bookings(db, skip=skip, limit=limit, status=status)

@router.get("/{booking_id}", response_model=BookingResponse)
def read_booking(booking_id: int, db: Session = Depends(get_db)):
    """Get a specific booking by ID"""
    booking = get_booking(db, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@router.post("/", response_model=BookingResponse)
def create_new_booking(booking: BookingCreate, db: Session = Depends(get_db)):
    """Create a new booking"""
    try:
        return create_booking(db, booking)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{booking_id}", response_model=BookingResponse)
def update_existing_booking(
    booking_id: int, 
    booking_update: BookingUpdate, 
    db: Session = Depends(get_db)
):
    """Update an existing booking"""
    try:
        booking = update_booking(db, booking_id, booking_update)
        if booking is None:
            raise HTTPException(status_code=404, detail="Booking not found")
        return booking
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{booking_id}")
def delete_existing_booking(booking_id: int, db: Session = Depends(get_db)):
    """Delete a booking"""
    if not delete_booking(db, booking_id):
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": "Booking deleted successfully"}

@router.get("/date/{target_date}", response_model=List[BookingResponse])
def get_bookings_for_date(target_date: date, db: Session = Depends(get_db)):
    """Get all bookings for a specific date"""
    next_date = target_date.replace(day=target_date.day + 1) if target_date.day < 28 else target_date.replace(month=target_date.month + 1, day=1)
    return get_bookings_by_date_range(db, target_date, next_date)
