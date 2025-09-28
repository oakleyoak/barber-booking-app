import { WebPlugin } from '@capacitor/core';

import type { StripeTerminalPlugin, Reader, PaymentIntent, PaymentStatusEvent } from './definitions';

export class StripeTerminalWeb extends WebPlugin implements StripeTerminalPlugin {
  async initialize(options: { token: string }): Promise<void> {
    console.log('Stripe Terminal Web: Initialize called with token:', options.token);
    // Web implementation - would show instructions for mobile app
    throw new Error('Stripe Terminal is only available on mobile devices. Please use the Android/iOS app.');
  }

  async discoverReaders(): Promise<{ readers: Reader[] }> {
    throw new Error('Stripe Terminal is only available on mobile devices.');
  }

  async connectReader(options: { readerId: string }): Promise<void> {
    throw new Error('Stripe Terminal is only available on mobile devices.');
  }

  async processPayment(options: { amount: number; currency: string }): Promise<{ paymentIntent: PaymentIntent }> {
    throw new Error('Stripe Terminal is only available on mobile devices.');
  }

  async disconnectReader(): Promise<void> {
    throw new Error('Stripe Terminal is only available on mobile devices.');
  }
}