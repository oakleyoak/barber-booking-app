const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://libpiqpetkiojiqzzlpa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYnBpcXBldGtpb2ppcXp6bHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTkwMTMsImV4cCI6MjA3MTc5NTAxM30.7NCI5kRr0BHI-X1vW5Lb1YfOolVH0x-XvYVVjSCobhI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupAndFix() {
  try {
    // Delete ALL Oak bookings to clean up the duplicates
    await supabase
      .from('bookings')
      .delete()
      .eq('customer_name', 'Oak');
    
    console.log('Deleted duplicate bookings');
    
    // Create ONE clean booking with payment tracking
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        customer_name: 'Oak',
        service: 'Haircut',
        price: 700,
        date: '2025-09-02',
        time: '09:00:00',
        status: 'completed',
        payment_status: 'pending',
        payment_amount: 700
      })
      .select();
    
    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('Created clean booking:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

cleanupAndFix();
