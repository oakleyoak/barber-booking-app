import React from 'react';
import { Users, Phone, Mail } from 'lucide-react';

interface CustomerManagerProps {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: string;
    shop_name: string;
  };
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ currentUser }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Manager</h2>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add Customer
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
          <p className="text-gray-500">Start adding customers to manage your client base</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerManager;
