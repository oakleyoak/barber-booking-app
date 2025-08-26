import { useState, useEffect } from 'react';
import { Booking } from '../types';
import { bookingService } from '../services/api';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    client?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getBookings(params);
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const refreshBookings = () => {
    fetchBookings();
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    refreshBookings,
  };
};
