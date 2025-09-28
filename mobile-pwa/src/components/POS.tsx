import React, { useState } from 'react';
import { CreditCard, Smartphone, Receipt, Plus, Minus, X } from 'lucide-react';
import { SERVICES } from '../services/servicePricing';

interface POSProps {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: string;
    shop_name: string;
  };
}

const POS: React.FC<POSProps> = ({ currentUser }) => {
  const [cart, setCart] = useState<Array<{name: string, price: number, quantity: number}>>([]);
  const [selectedService, setSelectedService] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  // Use real services from servicePricing.ts
  const services = SERVICES.map(s => ({ name: s.name, price: s.price }));

  const addToCart = (service: {name: string, price: number}) => {
    setCart(prev => {
      const existing = prev.find(item => item.name === service.name);
      if (existing) {
        return prev.map(item =>
          item.name === service.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...service, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (name: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.name !== name));
    } else {
      setCart(prev => prev.map(item =>
        item.name === name ? { ...item, quantity } : item
      ));
    }
  };

  const addCustomAmount = () => {
    const amount = parseFloat(customAmount);
    if (amount > 0) {
      addToCart({ name: 'Custom Amount', price: amount });
      setCustomAmount('');
    }
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const processPayment = async () => {
    const total = getTotal();
    if (total === 0) return;

    // TODO: Integrate with Stripe Tap & Pay
    alert(`Processing payment of $${(total / 100).toFixed(2)} with Stripe Tap & Pay\n\nThis feature will be implemented with:\n- Stripe Terminal SDK\n- NFC/Contactless payment processing\n- Receipt generation`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-6">
          <CreditCard className="h-8 w-8 text-green-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Services Selection */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Services</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {services.map((service) => (
                <button
                  key={service.name}
                  onClick={() => addToCart(service)}
                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-3 text-left transition-colors"
                >
                  <div className="font-medium text-sm">{service.name}</div>
                  <div className="text-green-600 font-semibold">₺{service.price}</div>
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">Custom Amount</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount in cents"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addCustomAmount}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Cart */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Current Order</h2>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[300px]">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items in cart</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.name} className="flex items-center justify-between bg-white p-3 rounded border">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-green-600">₺{item.price} each</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.name, item.quantity - 1)}
                          className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.name, item.quantity + 1)}
                          className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => updateQuantity(item.name, 0)}
                          className="w-6 h-6 bg-red-200 text-red-600 rounded-full flex items-center justify-center ml-2"
                          aria-label="Remove item"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total and Payment */}
            <div className="mt-4">
              <div className="flex justify-between items-center text-lg font-semibold mb-4">
                <span>Total:</span>
                <span className="text-green-600">₺{(getTotal() / 100).toFixed(2)}</span>
              </div>

              <button
                onClick={processPayment}
                disabled={cart.length === 0}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Smartphone className="h-5 w-5" />
                Pay with Tap & Pay
              </button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Stripe Tap & Pay Integration</h3>
              <p className="text-sm text-blue-800">
                This POS system will integrate with Stripe's Tap to Pay on Android devices for contactless payments.
                Customers can tap their cards or use digital wallets (Apple Pay, Google Pay) directly on your device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;