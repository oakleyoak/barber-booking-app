import React, { useState } from 'react';
import { X, Calendar, Clock, DollarSign, MapPin, User, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { BookingCreate, BookingUpdate } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookingCreate | BookingUpdate) => Promise<void>;
  initialData?: BookingCreate | BookingUpdate | null;
  mode: 'create' | 'edit';
  selectedDate?: Date;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  selectedDate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<BookingCreate>({
    defaultValues: initialData || {
      client_name: '',
      start_time: selectedDate ? 
        new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000)
          .toISOString().slice(0, 16) : '',
      end_time: selectedDate ? 
        new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000 + 3600000)
          .toISOString().slice(0, 16) : '',
      price: 0,
      notes: '',
      location: '',
      status: 'confirmed'
    }
  });

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else if (selectedDate && mode === 'create') {
      const startTime = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000);
      const endTime = new Date(startTime.getTime() + 3600000); // 1 hour later
      
      reset({
        client_name: '',
        start_time: startTime.toISOString().slice(0, 16),
        end_time: endTime.toISOString().slice(0, 16),
        price: 0,
        notes: '',
        location: '',
        status: 'confirmed'
      });
    }
  }, [initialData, selectedDate, mode, reset]);

  const handleFormSubmit = async (data: BookingCreate) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b bg-edge-primary">
          <h2 className="text-lg font-serif font-bold flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5" />
            {mode === 'create' ? 'Create Booking' : 'Edit Booking'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-edge-secondary rounded text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              Client Name *
            </label>
            <input
              {...register('client_name', { required: 'Client name is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-edge-primary focus:border-edge-primary"
              placeholder="Enter client name"
            />
            {errors.client_name && (
              <p className="text-red-500 text-sm mt-1">{errors.client_name.message}</p>
            )}
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Start Time *
            </label>
            <input
              {...register('start_time', { required: 'Start time is required' })}
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-edge-primary focus:border-edge-primary"
            />
            {errors.start_time && (
              <p className="text-red-500 text-sm mt-1">{errors.start_time.message}</p>
            )}
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              End Time *
            </label>
            <input
              {...register('end_time', { required: 'End time is required' })}
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-edge-primary focus:border-edge-primary"
            />
            {errors.end_time && (
              <p className="text-red-500 text-sm mt-1">{errors.end_time.message}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Price *
            </label>
            <input
              {...register('price', { 
                required: 'Price is required',
                min: { value: 0, message: 'Price must be positive' }
              })}
              type="number"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-edge-primary focus:border-edge-primary"
              placeholder="0.00"
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </label>
            <input
              {...register('location')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-edge-primary focus:border-edge-primary"
              placeholder="Enter location"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-edge-primary focus:border-edge-primary"
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-edge-primary focus:border-edge-primary"
              placeholder="Additional notes..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-edge-primary text-white rounded-md hover:bg-edge-secondary disabled:opacity-50 transition-colors font-medium"
            >
              {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create' : 'Update')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
