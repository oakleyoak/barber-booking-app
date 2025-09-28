// Get Stripe connection token for Terminal SDK
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
    // Create a connection token for the Terminal SDK
    const connectionToken = await stripe.terminal.connectionTokens.create();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        secret: connectionToken.secret
      })
    };

  } catch (error) {
    console.error('Error creating connection token:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to create connection token',
        message: error.message
      })
    };
  }
};