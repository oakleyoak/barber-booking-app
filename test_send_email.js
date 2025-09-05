const { handler } = require('./netlify/functions/send-email');

async function run() {
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({
      email_content: {
        to: 'turkcypriot@hotmail.com',
        subject: 'Test email — Edge & Co Barbershop',
        html: `<div><h3>Edge & Co — Test Email</h3><p>This is a live test sent by the repository test runner at ${new Date().toISOString()}.</p><p>If you received this, the SMTP/send-email function worked.</p></div>`
      }
    })
  };

  try {
    const res = await handler(event, {});
    console.log('FUNCTION RESPONSE:', res);
    if (res && res.statusCode) {
      try {
        console.log('BODY:', JSON.parse(res.body));
      } catch (e) {
        console.log('BODY (raw):', res.body);
      }
    }
  } catch (err) {
    console.error('ERROR CALLING FUNCTION:', err);
  }
}

run();
