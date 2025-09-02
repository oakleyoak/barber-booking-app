// Business Configuration for Edge & Co Barbershop
// Update these values with your actual business information

export const BusinessConfig = {
  // Bank Information
  iban: 'TR XX XXXX XXXX XXXX XXXX XXXX XX', // Replace with your actual IBAN
  accountHolder: 'Edge & Co Barbershop',
  bankName: 'Your Bank Name',
  
  // Business Information
  businessName: 'Edge & Co Barbershop',
  businessEmail: 'edgeandcobarber@gmail.com',
  businessPhone: '+90 XXX XXX XX XX', // Replace with your phone
  businessAddress: 'Your Business Address', // Replace with your address
  
  // Payment Settings
  invoiceDueDays: 7, // Days until payment is due
  lateFeePercentage: 5, // Late fee percentage if needed
  
  // Online Payment Links (when you set them up)
  paypalLink: 'https://paypal.me/yourpaypallink', // Replace when ready
  stripeLink: 'https://checkout.stripe.com/yourlink', // Replace when ready
  
  // Invoice Settings
  invoicePrefix: 'EC', // Edge & Co prefix for invoice numbers
  taxRate: 0, // Set tax rate if applicable (0 for no tax)
  
  // Currency
  currency: 'TRY',
  currencySymbol: '₺'
};

// You can update these values as needed for your business
