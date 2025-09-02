const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://libpiqpetkiojiqzzlpa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnBpcXBldGtpb2ppcXp6bHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTkwMTMsImV4cCI6MjA3MTc5NTAxM30.7NCI5kRr0BHI-X1vW5Lb1YfOolVH0x-XvYVVjSCobhI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertExactBooking() {
  try {
    // Delete any existing booking with this ID first
    await supabase
      .from('bookings')
      .delete()
      .eq('id', '1041f019-b776-4a70-81f1-201dce05ee1f');
    
    // Insert the exact booking that the app expects
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        id: '1041f019-b776-4a70-81f1-201dce05ee1f',
        customer_name: 'Oak',
        service: 'Haircut',
        price: 700,
        date: '2025-09-02',
        time: '09:00:00',
        status: 'completed',
        payment_status: 'pending',
        payment_method: null,
        stripe_payment_id: null,
        invoice_number: null,
        payment_received_at: null,
        payment_amount: 700
      })
      .select();
    
    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('Successfully created booking with payment tracking:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

insertExactBooking();
