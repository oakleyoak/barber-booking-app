// client-side helper to call the Supabase Edge Function
const FUNCTION_URL = 'https://libpiqpetkiojiqzzlpa.functions.supabase.co/send-email';

export async function sendBookingEmail(bookingId: string) {
  try {
    console.log('Calling email function with URL:', FUNCTION_URL);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const resp = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('Email function response status:', resp.status);
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('Email function error response:', errorText);
      throw new Error(`Email function failed: ${resp.status} - ${errorText}`);
    }
    
    const result = await resp.json();
    console.log('Email function result:', result);
    return result;
  } catch (error) {
    console.error('sendBookingEmail error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Email function timed out after 10 seconds');
    }
    throw error;
  }
}

export async function sendAdhocEmail(to: string, subject: string, html: string) {
  try {
    console.log('Calling adhoc email function with URL:', FUNCTION_URL);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const resp = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('Adhoc email function response status:', resp.status);
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('Adhoc email function error response:', errorText);
      throw new Error(`Email function failed: ${resp.status} - ${errorText}`);
    }
    
    const result = await resp.json();
    console.log('Adhoc email function result:', result);
    return result;
  } catch (error) {
    console.error('sendAdhocEmail error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Email function timed out after 10 seconds');
    }
    throw error;
  }
}
