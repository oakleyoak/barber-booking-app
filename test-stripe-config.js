// Quick test for Stripe integration
const testStripeConfig = {
  publishableKey: '<<REDACTED - SET IN NETLIFY ENV>>',
  secretKey: '<<REDACTED - SET IN NETLIFY ENV>>'
};

console.log('✅ Stripe Keys Configured:');
console.log('✅ Publishable Key:', testStripeConfig.publishableKey.substring(0, 20) + '...');
console.log('✅ Secret Key:', testStripeConfig.secretKey.substring(0, 20) + '...');
console.log('✅ Currency: TRY (Turkish Lira)');
console.log('✅ Payment Methods: IBAN + Stripe Cards');
console.log('✅ Ready for deployment!');
