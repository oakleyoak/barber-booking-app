const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.handler = async ({ body, headers }) => {
  const sig = headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Checkout session was successful!', session);

    const { invoice_number } = session.metadata;
    const paymentIntentId = session.payment_intent;

    if (!invoice_number) {
        console.error('Webhook Error: Missing invoice_number in session metadata.');
        return { statusCode: 400, body: 'Missing invoice_number in metadata.' };
    }

    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .update({ 
          payment_status: 'paid',
          payment_method: 'card',
          payment_received_at: new Date().toISOString(),
          stripe_payment_id: paymentIntentId // Store the actual payment intent ID
        })
        .eq('invoice_number', invoice_number)
        .select()
        .single();

      if (error) {
        console.error('Error updating booking:', error);
        return { statusCode: 500, body: 'Error updating booking in database.' };
      }

      if (booking) {
        console.log('Successfully updated booking payment status for invoice:', invoice_number);
      } else {
        console.warn('No matching booking found for invoice number:', invoice_number);
      }

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return { statusCode: 500, body: 'Database operation failed.' };
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
