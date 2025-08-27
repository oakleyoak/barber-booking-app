from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.database import get_db
from app.schemas import EarningsSummary, WeeklyEarnings
from app.crud import get_daily_earnings, get_weekly_earnings

router = APIRouter(prefix="/earnings", tags=["earnings"])

@router.get("/daily/{target_date}", response_model=EarningsSummary)
def get_earnings_for_date(target_date: date, db: Session = Depends(get_db)):
    """Get earnings summary for a specific date"""
    return get_daily_earnings(db, target_date)

@router.get("/weekly/{week_start}", response_model=WeeklyEarnings)
def get_earnings_for_week(week_start: date, db: Session = Depends(get_db)):
    """Get earnings summary for a week starting from the given date"""
    return get_weekly_earnings(db, week_start)

@router.get("/weekly/current", response_model=WeeklyEarnings)
def get_current_week_earnings(db: Session = Depends(get_db)):
    """Get earnings for the current week (Monday to Sunday)"""
    today = date.today()
    # Get the Monday of the current week
    days_since_monday = today.weekday()
    monday = today - timedelta(days=days_since_monday)
    return get_weekly_earnings(db, monday)

@router.get("/range/{start_date}/{end_date}")
def get_earnings_range(start_date: date, end_date: date, db: Session = Depends(get_db)):
    """Get earnings summary for a date range"""
    current_date = start_date
    daily_summaries = []
    total_earnings = 0
    
    while current_date <= end_date:
        daily = get_daily_earnings(db, current_date)
        daily_summaries.append(daily)
        total_earnings += daily["total_earnings"]
        current_date += timedelta(days=1)
    
    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_earnings": total_earnings,
        "daily_summaries": daily_summaries,
        "days_count": len(daily_summaries),
        "average_daily": total_earnings / len(daily_summaries) if daily_summaries else 0
    }
