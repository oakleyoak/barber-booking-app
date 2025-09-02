const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const sig = event.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let stripeEvent;

    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Webhook signature verification failed' })
      };
    }

    // Handle the event
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
      case 'payment_link.payment_succeeded':
        await handlePaymentSuccess(stripeEvent.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object);
        break;
      default:
        console.log(`Unhandled event type ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Webhook handler failed' })
    };
  }
};

async function handlePaymentSuccess(paymentData) {
  try {
    console.log('🎉 Payment succeeded:', paymentData.id);
    
    // Extract invoice number from metadata or description
    const invoiceNumber = paymentData.metadata?.invoice_number;
    
    if (!invoiceNumber) {
      console.error('No invoice number found in payment metadata');
      return;
    }

    // Update booking payment status
    const { data, error } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        payment_method: 'stripe',
        stripe_payment_id: paymentData.id,
        payment_received_at: new Date().toISOString(),
        payment_amount: paymentData.amount_total ? paymentData.amount_total / 100 : null
      })
      .eq('invoice_number', invoiceNumber);

    if (error) {
      console.error('Failed to update booking payment status:', error);
    } else {
      console.log('✅ Updated booking payment status for invoice:', invoiceNumber);
    }

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentData) {
  try {
    console.log('❌ Payment failed:', paymentData.id);
    
    // Extract invoice number from metadata
    const invoiceNumber = paymentData.metadata?.invoice_number;
    
    if (!invoiceNumber) {
      console.error('No invoice number found in failed payment metadata');
      return;
    }

    // Update booking payment status
    const { data, error } = await supabase
      .from('bookings')
      .update({
        payment_status: 'failed',
        stripe_payment_id: paymentData.id
      })
      .eq('invoice_number', invoiceNumber);

    if (error) {
      console.error('Failed to update booking payment status:', error);
    } else {
      console.log('⚠️ Updated booking payment status for failed payment:', invoiceNumber);
    }

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}
