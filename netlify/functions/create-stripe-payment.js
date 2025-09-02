// Use Stripe secret from environment only. Do NOT commit secrets to the repository.
const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  console.error('Missing STRIPE_SECRET_KEY environment variable');
}
const stripe = require('stripe')(stripeSecret);

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

  try {
    const { amount, currency, description, invoiceNumber, customerEmail, customerName } = JSON.parse(event.body);

    console.log('🔐 Creating Stripe payment link for:', { amount, currency, description });

    // Create a Stripe Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description,
              metadata: {
                invoice_number: invoiceNumber,
                customer_name: customerName,
                service_type: 'barbershop'
              }
            },
            unit_amount: amount, // Amount in smallest currency unit (kuruş for TRY)
          },
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: 'https://edgeandco.netlify.app/payment-success?invoice=' + invoiceNumber,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_creation: 'always',
      metadata: {
        invoice_number: invoiceNumber,
        customer_email: customerEmail,
        customer_name: customerName,
        business: 'Edge & Co Barbershop'
      }
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
