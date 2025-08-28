import React, { useState } from 'react';
import { adminService } from '../services/adminService';

const AdminFix: React.FC = () => {
  const [email, setEmail] = useState('ismailhmahmut@googlemail.com');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFixUser = async () => {
    if (!email || !password) {
      setMessage('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await adminService.createAuthUserForExistingDbUser(email, password);
      setMessage(result.message);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-lg font-medium text-yellow-800 mb-4">
            Admin: Fix User Authentication
          </h3>
          <p className="text-sm text-yellow-700 mb-4">
            This tool creates an auth user for someone who exists in the database but can't login.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-yellow-800">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border border-yellow-300 rounded-md px-3 py-2"
                placeholder="Enter user email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-yellow-800">
                Temporary Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full border border-yellow-300 rounded-md px-3 py-2"
                placeholder="Enter temporary password"
              />
              <p className="text-xs text-yellow-600 mt-1">
                User should change this password after first login
              </p>
            </div>
            
            <button
              onClick={handleFixUser}
              disabled={isLoading}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating Auth User...' : 'Create Auth User'}
            </button>
            
            {message && (
              <div className={`p-3 rounded-md ${
                message.includes('successfully') || message.includes('already exists')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFix;
