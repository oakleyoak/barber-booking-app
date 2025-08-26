from sqlalchemy.orm import Session
from sqlalchemy import and_, func, extract
from datetime import datetime, date, timedelta
from app.database import Booking
from app.schemas import BookingCreate, BookingUpdate
from typing import List, Optional

def get_booking(db: Session, booking_id: int):
    return db.query(Booking).filter(Booking.id == booking_id).first()

def get_bookings(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None):
    query = db.query(Booking)
    if status:
        query = query.filter(Booking.status == status)
    return query.offset(skip).limit(limit).all()

def get_bookings_by_date_range(db: Session, start_date: date, end_date: date):
    return db.query(Booking).filter(
        and_(
            Booking.start_time >= start_date,
            Booking.start_time <= end_date
        )
    ).order_by(Booking.start_time).all()

def get_bookings_by_client(db: Session, client_name: str):
    return db.query(Booking).filter(
        Booking.client_name.ilike(f"%{client_name}%")
    ).order_by(Booking.start_time).all()

def create_booking(db: Session, booking: BookingCreate):
    # Check for conflicts
    existing = db.query(Booking).filter(
        and_(
            Booking.start_time < booking.end_time,
            Booking.end_time > booking.start_time,
            Booking.status != "cancelled"
        )
    ).first()
    
    if existing:
        raise ValueError(f"Booking conflicts with existing booking for {existing.client_name} at {existing.start_time}")
    
    db_booking = Booking(**booking.dict())
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

def update_booking(db: Session, booking_id: int, booking_update: BookingUpdate):
    db_booking = get_booking(db, booking_id)
    if not db_booking:
        return None
    
    update_data = booking_update.dict(exclude_unset=True)
    
    # If updating time, check for conflicts
    if 'start_time' in update_data or 'end_time' in update_data:
        start_time = update_data.get('start_time', db_booking.start_time)
        end_time = update_data.get('end_time', db_booking.end_time)
        
        existing = db.query(Booking).filter(
            and_(
                Booking.id != booking_id,
                Booking.start_time < end_time,
                Booking.end_time > start_time,
                Booking.status != "cancelled"
            )
        ).first()
        
        if existing:
            raise ValueError(f"Updated booking conflicts with existing booking for {existing.client_name}")
    
    for key, value in update_data.items():
        setattr(db_booking, key, value)
    
    db_booking.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_booking)
    return db_booking

def delete_booking(db: Session, booking_id: int):
    db_booking = get_booking(db, booking_id)
    if db_booking:
        db.delete(db_booking)
        db.commit()
        return True
    return False

def get_daily_earnings(db: Session, target_date: date):
    bookings = db.query(Booking).filter(
        and_(
            extract('year', Booking.start_time) == target_date.year,
            extract('month', Booking.start_time) == target_date.month,
            extract('day', Booking.start_time) == target_date.day
        )
    ).all()
    
    total_earnings = sum(b.price for b in bookings)
    confirmed_earnings = sum(b.price for b in bookings if b.status == "confirmed")
    
    return {
        "date": target_date.isoformat(),
        "total_earnings": total_earnings,
        "booking_count": len(bookings),
        "confirmed_earnings": confirmed_earnings,
        "confirmed_count": len([b for b in bookings if b.status == "confirmed"])
    }

def get_weekly_earnings(db: Session, week_start: date):
    week_end = week_start + timedelta(days=6)
    
    bookings = db.query(Booking).filter(
        and_(
            Booking.start_time >= week_start,
            Booking.start_time <= week_end + timedelta(days=1)
        )
    ).all()
    
    # Group by day
    daily_breakdown = []
    total_weekly = 0
    
    for i in range(7):
        current_date = week_start + timedelta(days=i)
        day_earnings = get_daily_earnings(db, current_date)
        daily_breakdown.append(day_earnings)
        total_weekly += day_earnings["total_earnings"]
    
    return {
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "total_earnings": total_weekly,
        "daily_breakdown": daily_breakdown,
        "average_daily": total_weekly / 7
    }
