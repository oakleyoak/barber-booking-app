import React from 'react';
import { DollarSign, Users, FileText } from 'lucide-react';

interface AdminPanelProps {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: string;
    shop_name: string;
  };
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const payrollData = {
    totalGrossPay: 250.00,
    totalNetPay: 180.00,
    totalDeductions: 70.00
  };

  const staffMember = {
    name: 'Ismail Hassan Azimkar',
    role: 'Barber',
    commissionRate: 60,
    grossSales: 250.00,
    grossPay: 150.00,
    socialInsurance: -30.00,
    incomeTax: -0.00,
    netPay: 120.00,
    services: 8
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
        <p className="text-gray-600">Manage your barbershop operations</p>
      </div>

      {/* Admin Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
          Staff Bookings
        </button>
        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
          User Management
        </button>
        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
          POS Reports
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Payroll
        </button>
        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
          Expenses
        </button>
        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
          Shop Settings
        </button>
        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
          Analytics
        </button>
      </div>

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-sm font-medium text-blue-600 mb-2">Total Gross Pay</h3>
          <div className="text-2xl font-bold text-blue-900">£{payrollData.totalGrossPay.toFixed(2)}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h3 className="text-sm font-medium text-green-600 mb-2">Total Net Pay</h3>
          <div className="text-2xl font-bold text-green-900">£{payrollData.totalNetPay.toFixed(2)}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-sm font-medium text-red-600 mb-2">Total Deductions</h3>
          <div className="text-2xl font-bold text-red-900">£{payrollData.totalDeductions.toFixed(2)}</div>
        </div>
      </div>

      {/* Staff Payroll Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Staff Payroll Summary - This Week</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-600">STAFF MEMBER</th>
                <th className="text-center py-2 text-sm font-medium text-gray-600">COMMISSION RATE</th>
                <th className="text-center py-2 text-sm font-medium text-gray-600">GROSS SALES</th>
                <th className="text-center py-2 text-sm font-medium text-gray-600">GROSS PAY</th>
                <th className="text-center py-2 text-sm font-medium text-gray-600">SOCIAL INSURANCE</th>
                <th className="text-center py-2 text-sm font-medium text-gray-600">INCOME TAX</th>
                <th className="text-center py-2 text-sm font-medium text-gray-600">NET PAY</th>
                <th className="text-center py-2 text-sm font-medium text-gray-600">SERVICES</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                      I
                    </div>
                    <div>
                      <div className="font-medium">{staffMember.name}</div>
                      <div className="text-sm text-gray-500">{staffMember.role}</div>
                    </div>
                  </div>
                </td>
                <td className="text-center py-3">{staffMember.commissionRate}%</td>
                <td className="text-center py-3">£{staffMember.grossSales.toFixed(2)}</td>
                <td className="text-center py-3">£{staffMember.grossPay.toFixed(2)}</td>
                <td className="text-center py-3 text-red-600">-£{Math.abs(staffMember.socialInsurance).toFixed(2)}</td>
                <td className="text-center py-3 text-red-600">-£{Math.abs(staffMember.incomeTax).toFixed(2)}</td>
                <td className="text-center py-3 font-semibold">£{staffMember.netPay.toFixed(2)}</td>
                <td className="text-center py-3">{staffMember.services} services</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payroll Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Payroll Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between py-2">
              <span>Social Insurance Rate:</span>
              <span className="font-semibold">20%</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Income Tax Rate:</span>
              <span className="font-semibold">15% (if &gt; £1000)</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between py-2">
              <span>Barber Commission:</span>
              <span className="font-semibold">60%</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Apprentice Commission:</span>
              <span className="font-semibold">40%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
