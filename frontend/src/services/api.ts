import axios from 'axios';
import { Booking, BookingCreate, BookingUpdate, EarningsSummary, WeeklyEarnings } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Booking endpoints
export const bookingService = {
  // Get all bookings with optional filters
  getBookings: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    client?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Booking[]> => {
    const response = await api.get('/bookings/', { params });
    return response.data;
  },

  // Get a specific booking
  getBooking: async (id: number): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  // Create a new booking
  createBooking: async (booking: BookingCreate): Promise<Booking> => {
    const response = await api.post('/bookings/', booking);
    return response.data;
  },

  // Update a booking
  updateBooking: async (id: number, booking: BookingUpdate): Promise<Booking> => {
    const response = await api.put(`/bookings/${id}`, booking);
    return response.data;
  },

  // Delete a booking
  deleteBooking: async (id: number): Promise<void> => {
    await api.delete(`/bookings/${id}`);
  },

  // Get bookings for a specific date
  getBookingsForDate: async (date: string): Promise<Booking[]> => {
    const response = await api.get(`/bookings/date/${date}`);
    return response.data;
  },
};

// Earnings endpoints
export const earningsService = {
  // Get daily earnings
  getDailyEarnings: async (date: string): Promise<EarningsSummary> => {
    const response = await api.get(`/earnings/daily/${date}`);
    return response.data;
  },

  // Get weekly earnings
  getWeeklyEarnings: async (weekStart: string): Promise<WeeklyEarnings> => {
    const response = await api.get(`/earnings/weekly/${weekStart}`);
    return response.data;
  },

  // Get current week earnings
  getCurrentWeekEarnings: async (): Promise<WeeklyEarnings> => {
    const response = await api.get('/earnings/weekly/current');
    return response.data;
  },

  // Get earnings for date range
  getEarningsRange: async (startDate: string, endDate: string) => {
    const response = await api.get(`/earnings/range/${startDate}/${endDate}`);
    return response.data;
  },
};

export default api;
