import React, { useState, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Booking, CalendarEvent, BookingCreate, BookingUpdate } from '../types';
import { bookingService } from '../services/api';
import { format } from 'date-fns';

interface BookingCalendarProps {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
  onDateClick: (date: Date) => void;
  onEventDrop: (booking: Booking, newStart: Date, newEnd: Date) => Promise<void>;
  refreshBookings: () => void;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  bookings,
  onBookingClick,
  onDateClick,
  onEventDrop,
  refreshBookings
}) => {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Convert bookings to calendar events
  useEffect(() => {
    const events: CalendarEvent[] = bookings.map(booking => ({
      id: booking.id.toString(),
      title: `${booking.client_name} - $${booking.price}`,
      start: booking.start_time,
      end: booking.end_time,
      backgroundColor: getEventColor(booking.status),
      borderColor: getEventColor(booking.status),
      extendedProps: {
        booking
      }
    }));
    setCalendarEvents(events);
  }, [bookings]);

  const getEventColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#22c55e'; // green
      case 'pending':
        return '#f59e0b'; // amber
      case 'cancelled':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const handleEventClick = useCallback((clickInfo: any) => {
    const booking = clickInfo.event.extendedProps.booking;
    onBookingClick(booking);
  }, [onBookingClick]);

  const handleDateClick = useCallback((selectInfo: any) => {
    onDateClick(selectInfo.date);
  }, [onDateClick]);

  const handleEventDrop = useCallback(async (dropInfo: any) => {
    const booking = dropInfo.event.extendedProps.booking;
    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end || new Date(newStart.getTime() + (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()));
    
    try {
      await onEventDrop(booking, newStart, newEnd);
      refreshBookings();
    } catch (error) {
      console.error('Failed to update booking:', error);
      dropInfo.revert(); // Revert the change if it failed
    }
  }, [onEventDrop, refreshBookings]);

  const handleEventResize = useCallback(async (resizeInfo: any) => {
    const booking = resizeInfo.event.extendedProps.booking;
    const newStart = resizeInfo.event.start;
    const newEnd = resizeInfo.event.end;
    
    try {
      await onEventDrop(booking, newStart, newEnd);
      refreshBookings();
    } catch (error) {
      console.error('Failed to resize booking:', error);
      resizeInfo.revert(); // Revert the change if it failed
    }
  }, [onEventDrop, refreshBookings]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        initialView="timeGridWeek"
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={calendarEvents}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        height="auto"
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        eventDisplay="block"
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
          startTime: '08:00',
          endTime: '18:00'
        }}
      />
    </div>
  );
};

export default BookingCalendar;
