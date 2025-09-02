const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://libpiqpetkiojiqzzlpa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnBpcXBldGtpb2ppcXp6bHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTkwMTMsImV4cCI6MjA3MTc5NTAxM30.7NCI5kRr0BHI-X1vW5Lb1YfOolVH0x-XvYVVjSCobhI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBookingsStructure() {
  try {
    // Try to select all columns from bookings table
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Booking table structure:');
      console.log('Available columns:', Object.keys(data[0]));
      
      // Check specifically for payment tracking columns
      const paymentColumns = ['payment_status', 'payment_method', 'stripe_payment_id', 'invoice_number', 'payment_date'];
      const existingPaymentColumns = paymentColumns.filter(col => col in data[0]);
      const missingPaymentColumns = paymentColumns.filter(col => !(col in data[0]));
      
      console.log('\nPayment tracking columns found:', existingPaymentColumns);
      console.log('Payment tracking columns missing:', missingPaymentColumns);
      
      if (missingPaymentColumns.length === 0) {
        console.log('\n✅ ALL PAYMENT TRACKING COLUMNS ARE PRESENT!');
      } else {
        console.log('\n❌ Some payment tracking columns are missing');
      }
    } else {
      console.log('No bookings found in table');
      
      // Try to insert a test booking to see what columns are available
      const { error: insertError } = await supabase
        .from('bookings')
        .insert({
          customer_name: 'Test Structure Check',
          service: 'Test',
          price: 0,
          date: '2025-01-01',
          time: '10:00',
          status: 'scheduled'
        })
        .select();
        
      if (insertError) {
        console.log('Insert error (shows available columns):', insertError.message);
      }
    }
  } catch (err) {
    console.error('Script error:', err);
  }
}

testBookingsStructure();
