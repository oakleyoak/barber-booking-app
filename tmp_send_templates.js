const fs = require('fs');
const http = require('http');
const url = require('url');

(async () => {
  try {
    const notifications = fs.readFileSync('mobile-pwa/src/services/notifications.ts', 'utf8');

    // extract the booking notification template function body by simple markers
    const matchBooking = notifications.split('const generateBookingNotificationForBarber = (booking: any) => {')[1].split('};')[0];
    const bookingHtml = matchBooking.split('html: `')[1].split('`')[0];

    const bookingHtmlFilled = bookingHtml
      .replace(/\$\{booking.barber_name \|\| 'Team Member'\}/g, 'Murat')
      .replace(/\$\{booking.customer_name \|\| '—'\}/g, 'Ali')
      .replace(/\$\{booking.service \|\| '—'\}/g, 'Haircut')
      .replace(/\$\{booking.date \? new Date\(booking.date\)\.toLocaleDateString\(\) : '—'\}/g, new Date().toLocaleDateString())
      .replace(/\$\{booking.time \|\| '—'\}/g, '14:00')
      .replace(/\$\{booking.price \? `₺\$\{booking.price\}` : '—'\}/g, '₺700');

    const payload = {
      email_content: {
        to: 'turkcypriot@hotmail.com',
        subject: 'TEST — New Booking Assignment',
        html: bookingHtmlFilled
      }
    };

    const endpoint = 'http://localhost:8888/.netlify/functions/send-email';
    const parsed = url.parse(endpoint);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(payload))
      }
    };

    console.log('Sending booking notification to', payload.email_content.to);

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk.toString());
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        console.log('Response body:', data);
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err);
    });

    req.write(JSON.stringify(payload));
    req.end();

  } catch (e) {
    console.error('Error sending template:', e);
  }
})();
