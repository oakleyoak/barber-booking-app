export interface Booking {
  id: number;
  client_name: string;
  start_time: string;
  end_time: string;
  price: number;
  notes?: string;
  location?: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface BookingCreate {
  client_name: string;
  start_time: string;
  end_time: string;
  price: number;
  notes?: string;
  location?: string;
  status?: 'confirmed' | 'cancelled' | 'pending';
}

export interface BookingUpdate {
  client_name?: string;
  start_time?: string;
  end_time?: string;
  price?: number;
  notes?: string;
  location?: string;
  status?: 'confirmed' | 'cancelled' | 'pending';
}

export interface EarningsSummary {
  date: string;
  total_earnings: number;
  booking_count: number;
  confirmed_earnings: number;
  confirmed_count: number;
}

export interface WeeklyEarnings {
  week_start: string;
  week_end: string;
  total_earnings: number;
  daily_breakdown: EarningsSummary[];
  average_daily: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    booking: Booking;
  };
}
