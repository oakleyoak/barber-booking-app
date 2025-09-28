import type { PluginListenerHandle } from '@capacitor/core';

export interface StripeTerminalPlugin {
  /**
   * Initialize the Stripe Terminal SDK
   */
  initialize(options: { token: string }): Promise<void>;

  /**
   * Discover and connect to a reader
   */
  discoverReaders(): Promise<{ readers: Reader[] }>;

  /**
   * Connect to a specific reader
   */
  connectReader(options: { readerId: string }): Promise<void>;

  /**
   * Process a payment
   */
  processPayment(options: { amount: number; currency: string }): Promise<{ paymentIntent: PaymentIntent }>;

  /**
   * Disconnect from the current reader
   */
  disconnectReader(): Promise<void>;

  /**
   * Listen for payment events
   */
  addListener(eventName: 'paymentStatus', listenerFunc: (event: PaymentStatusEvent) => void): Promise<PluginListenerHandle>;
}

export interface Reader {
  id: string;
  label: string;
  status: 'online' | 'offline';
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'canceled';
}

export interface PaymentStatusEvent {
  status: 'processing' | 'success' | 'failed';
  message?: string;
}