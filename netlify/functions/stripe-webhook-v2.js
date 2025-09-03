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
    const paymentLinkId = session.payment_link; // Added to get payment link ID

    // Extract the card processing fee from the line items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const cardFeeItem = lineItems.data.find(item => item.description === 'Card Processing Fee');
    const cardProcessingFee = cardFeeItem ? cardFeeItem.amount_total / 100 : 0;

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
          stripe_payment_id: paymentIntentId, // Store the actual payment intent ID
          card_processing_fee: cardProcessingFee // Store the fee
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
        
        // Create transaction record for earnings tracking
        try {
          // Get the total amount paid and calculate earnings
          const totalAmountPaid = session.amount_total / 100; // Convert from cents to TRY
          const serviceAmount = totalAmountPaid - cardProcessingFee; // Service amount without processing fee
          
          // Get user details from booking
          const { data: user } = await supabase
            .from('users')
            .select('id, commission_rate')
            .eq('id', booking.user_id)
            .single();

          if (user) {
            const commissionRate = user.commission_rate || 60;
            const commissionAmount = serviceAmount * (commissionRate / 100);

            // Create transaction record
            const { error: transactionError } = await supabase
              .from('transactions')
              .insert({
                booking_id: booking.id,
                user_id: booking.user_id,
                customer_name: booking.customer_name,
                service: booking.service,
                amount: serviceAmount, // Service amount without processing fee
                commission: commissionRate,
                commission_amount: commissionAmount,
                date: new Date().toISOString().split('T')[0],
                status: 'completed'
              });

            if (transactionError) {
              console.error('Error creating transaction record:', transactionError);
            } else {
              console.log('✅ Created transaction record for card payment:', booking.id);
            }
          }
        } catch (earningsError) {
          console.error('Error creating earnings record:', earningsError);
          // Don't block the webhook for this error
        }
        
        // Deactivate the payment link
        if (paymentLinkId) {
          try {
            await stripe.paymentLinks.update(paymentLinkId, { active: false });
            console.log('Successfully deactivated payment link:', paymentLinkId);
          } catch (deactivationError) {
            console.error('Error deactivating payment link:', deactivationError);
            // Don't block the response for this, just log it
          }
        }
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
