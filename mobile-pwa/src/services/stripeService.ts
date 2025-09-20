// Stripe Integration Service for Edge & Co Barbershop
// This service creates payment links and handles Stripe payments

export interface StripeConfig {
  publishableKey: string;
  secretKey: string; // Keep this secure, never expose in frontend
  webhookSecret?: string;
}

export interface StripePaymentLink {
  id: string;
  url: string;
  service: string;
  price: number;
}

export const StripeService = {
  // Configuration (you'll update these with your actual Stripe keys)
  config: {
    publishableKey: 'pk_live_51S2uCgIyRLJZciJjHt6zrvEGMc8YfQGDsGo2vCDzE0E0KRpTWYRGnqQ26An4VfJkFOmPswYV8tTJxTQYKNep1pzJ00brzV4vsy', // Your live publishable key
    // Secret key should be in environment variables or backend only
  },

  // Generate Stripe payment link for a service
  generatePaymentLink: async (service: string, price: number, customerEmail: string): Promise<string> => {
    // This would typically be done on your backend for security
    // For now, we'll create a formatted URL that you can replace with actual Stripe links
    
    // When you have Stripe set up, replace this with actual Stripe Payment Links
    const stripeBaseUrl = 'https://buy.stripe.com/'; // Your actual payment link base
    const encodedService = encodeURIComponent(service);
    const amount = price * 100; // Stripe uses cents
    
    // This is a placeholder - replace with your actual Stripe payment link format
    return `${stripeBaseUrl}your-payment-link?service=${encodedService}&amount=${amount}&email=${customerEmail}`;
  },

  // Create Stripe Checkout session (for embedded payments)
  createCheckoutSession: (items: any[], customerEmail: string) => {
    // This should be implemented on your backend
    // Returns a checkout session URL
    console.log('Create checkout session for:', items, customerEmail);
    return 'https://checkout.stripe.com/session-id';
  },

  // Verify payment status (webhook handling)
  verifyPayment: (paymentIntentId: string) => {
    // This should verify payment on your backend
    console.log('Verifying payment:', paymentIntentId);
    return { status: 'succeeded', amount: 0 };
  }
};

// Stripe Payment Link Templates for your services
export const StripePaymentLinks = {
  // You'll replace these with your actual Stripe payment links once created
  haircut: 'https://buy.stripe.com/your-haircut-link',
  beardTrim: 'https://buy.stripe.com/your-beard-trim-link',
  beardCut: 'https://buy.stripe.com/your-beard-cut-link',
  headShave: 'https://buy.stripe.com/your-head-shave-link',
  
  // Generic payment link generator
  getPaymentLink: (serviceName: string, price: number): string => {
    // Map service names to your Stripe payment links
    const serviceKey = serviceName.toLowerCase().replace(/\s+/g, '');
    const links: Record<string, string> = {
      'haircut': StripePaymentLinks.haircut,
      'beardtrim': StripePaymentLinks.beardTrim,
      'beardcut': StripePaymentLinks.beardCut,
      'headshave': StripePaymentLinks.headShave,
    };
    
    return links[serviceKey] || `https://buy.stripe.com/your-default-link?amount=${price * 100}`;
  }
};
