from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional

class BookingBase(BaseModel):
    client_name: str
    start_time: datetime
    end_time: datetime
    price: float
    notes: Optional[str] = None
    location: Optional[str] = None
    status: str = "confirmed"
    
    @validator('end_time')
    def end_time_must_be_after_start_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v
    
    @validator('price')
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('price must be positive')
        return v

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    client_name: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    price: Optional[float] = None
    notes: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None

class BookingResponse(BookingBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class EarningsSummary(BaseModel):
    date: str
    total_earnings: float
    booking_count: int
    confirmed_earnings: float
    confirmed_count: int

class WeeklyEarnings(BaseModel):
    week_start: str
    week_end: str
    total_earnings: float
    daily_breakdown: list[EarningsSummary]
    average_daily: float
