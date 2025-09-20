// Use Stripe secret from environment only. Do NOT commit secrets to the repository.
const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  console.error('Missing STRIPE_SECRET_KEY environment variable');
}

let stripe = null;
if (stripeSecret) {
  stripe = require('stripe')(stripeSecret);
}

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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

  // Check if Stripe is properly configured
  if (!stripe) {
    console.error('❌ Stripe not configured - missing STRIPE_SECRET_KEY');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Stripe payment service not configured',
        message: 'Payment service is temporarily unavailable'
      })
    };
  }

  try {
    const { amount, currency, description, invoiceNumber, customerEmail, customerName, services, cardProcessingFee } = JSON.parse(event.body);

    console.log('🔐 Creating Stripe payment link for:', { amount, currency, description });

    const lineItems = services.map(service => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: service.name,
        },
        unit_amount: service.price * 100, // Stripe expects amount in kuruş
      },
      quantity: 1,
    }));

    if (cardProcessingFee && cardProcessingFee > 0) {
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: 'Card Processing Fee',
          },
          unit_amount: cardProcessingFee * 100,
        },
        quantity: 1,
      });
    }

    // Create a Stripe Payment Link
    const SITE_URL = process.env.SITE_URL || 'https://edgeandco.netlify.app';
    const paymentLink = await stripe.paymentLinks.create({
      line_items: lineItems,
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${SITE_URL}/payment-success?invoice=${invoiceNumber}`,
        },
      },
      restrictions: {
        completed_sessions: {
          limit: 1,
        },
      },
      allow_promotion_codes: true,
      metadata: {
        invoice_number: invoiceNumber,
        customer_email: customerEmail,
        customer_name: customerName,
        business: 'Edge & Co Barbershop'
      },
    });

    console.log('✅ Stripe payment link created:', paymentLink.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        url: paymentLink.url,
        id: paymentLink.id,
        message: 'Payment link created successfully'
      })
    };

  } catch (error) {
    console.error('❌ Stripe payment link creation failed:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to create payment link'
      })
    };
  }
};
