// client-side helper to call the Supabase Edge Function
const FUNCTION_URL = 'https://libpiqpetkiojiqzzlpa.functions.supabase.co/send-email';

export async function sendBookingEmail(bookingId: string) {
  const resp = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId })
  });
  return resp.json();
}

export async function sendAdhocEmail(to: string, subject: string, html: string) {
  const resp = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html })
  });
  return resp.json();
}
