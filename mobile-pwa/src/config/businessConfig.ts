// Business Configuration for Edge & Co Barbershop
// Update these values with your actual business information

export const BusinessConfig = {
  // Bank Information
  iban: 'TR41 0010 3000 0000 0056 6690 26',
  accountHolder: 'Dylan Ahmet Salih',
  bankName: 'Türkiye İş Bankası A.Ş.',
  bic: 'ISBKTRIS',
  bankAddress: 'Türkiye İş Bankası A.Ş., İş Kuleleri, Levent, 34330 Beşiktaş, Istanbul, Turkey',
  // Accent color used in invoice and buttons
  accentColor: '#3498db',
  
  // Business Information
  businessName: 'Edge & Co Barbershop',
  businessEmail: 'edgeandcobarber@gmail.com',
  businessPhone: '+90 XXX XXX XX XX', // Replace with your phone
  businessAddress: 'Your Business Address', // Replace with your address
  
  // Payment Settings
  invoiceDueDays: 7, // Days until payment is due
  lateFeePercentage: 5, // Late fee percentage if needed
  
  // Stripe Configuration (PUBLIC keys only - never put secret keys here!)
  stripe: {
    // Your actual Stripe publishable key
    publishableKey: 'pk_live_51S2uCgIyRLJZciJjHt6zrvEGMc8YfQGDsGo2vCDzE0E0KRpTWYRGnqQ26An4VfJkFOmPswYV8tTJxTQYKNep1pzJ00brzV4vsy',
    // Payment success/cancel URLs
    successUrl: 'https://edgeandco.netlify.app/payment-success',
    cancelUrl: 'https://edgeandco.netlify.app/payment-cancel',
  },
  // Public site URL used to build absolute asset links in email templates
  siteUrl: 'https://edgeandco.netlify.app',
  
  // Online Payment Links (when you set them up)
  // paypalLink: '', // PayPal removed
  
  // Invoice Settings
  invoicePrefix: 'EC', // Edge & Co prefix for invoice numbers
  taxRate: 0, // Set tax rate if applicable (0 for no tax)
  
  // Currency
  currency: 'TRY',
  currencySymbol: '₺'
};

// You can update these values as needed for your business
