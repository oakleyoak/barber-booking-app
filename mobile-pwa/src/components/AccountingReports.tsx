import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import { EarningsService } from '../services/earningsService';

interface AccountingReportsProps {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: string;
    shop_name: string;
  };
}

const AccountingReports: React.FC<AccountingReportsProps> = ({ currentUser }) => {
  const [reportType, setReportType] = useState('Profit & Loss Statement');
  const [period, setPeriod] = useState('Current Month');
  const [reportData, setReportData] = useState({
    revenue: {
      services: 0,
      products: 0,
      otherIncome: 0,
      total: 0
    },
    expenses: {
      staffCommissions: 0,
      rent: 2500.00,
      utilities: 300.00,
      supplies: 450.00,
      marketing: 200.00,
      insurance: 150.00,
      other: 100.00,
      total: 0
    }
  });

  useEffect(() => {
    // Load actual earnings data
    const monthlyEarnings = EarningsService.getMonthlyEarnings(currentUser.shop_name);
    const revenue = monthlyEarnings.totalAmount;
    const commissions = monthlyEarnings.totalCommission;
    
    const fixedExpenses = 2500 + 300 + 450 + 200 + 150 + 100; // rent + utilities + supplies + marketing + insurance + other
    const totalExpenses = commissions + fixedExpenses;

    setReportData({
      revenue: {
        services: revenue,
        products: 0,
        otherIncome: 0,
        total: revenue
      },
      expenses: {
        staffCommissions: commissions,
        rent: 2500.00,
        utilities: 300.00,
        supplies: 450.00,
        marketing: 200.00,
        insurance: 150.00,
        other: 100.00,
        total: totalExpenses
      }
    });
  }, [currentUser.shop_name]);

  const grossProfit = reportData.revenue.total - reportData.expenses.total;
  const netProfit = grossProfit;
  const profitMargin = ((netProfit / reportData.revenue.total) * 100);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Accounting Reports</h2>
        <p className="text-gray-600">TRNC compliant financial reports for your accountant</p>
      </div>

      {/* Report Controls */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
          <select 
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Profit & Loss Statement</option>
            <option>Balance Sheet</option>
            <option>Cash Flow</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Current Month</option>
            <option>Last Month</option>
            <option>Current Quarter</option>
            <option>Current Year</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold">{currentUser.shop_name}</h3>
          <h4 className="text-xl font-semibold mt-2">Profit & Loss Statement</h4>
          <p className="text-gray-600">8/1/2025 - 8/31/2025</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Revenue */}
          <div>
            <h4 className="text-lg font-semibold text-green-700 mb-4">REVENUE</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Services</span>
                <span>₺{reportData.revenue.services.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Products</span>
                <span>₺{reportData.revenue.products.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Income</span>
                <span>₺{reportData.revenue.otherIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total Revenue</span>
                <span>₺{reportData.revenue.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div>
            <h4 className="text-lg font-semibold text-red-700 mb-4">EXPENSES</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Staff Commissions</span>
                <span>₺{reportData.expenses.staffCommissions.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Rent</span>
                <span>₺{reportData.expenses.rent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Utilities</span>
                <span>₺{reportData.expenses.utilities.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Supplies</span>
                <span>₺{reportData.expenses.supplies.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Marketing</span>
                <span>₺{reportData.expenses.marketing.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Insurance</span>
                <span>₺{reportData.expenses.insurance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Other</span>
                <span>₺{reportData.expenses.other.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total Expenses</span>
                <span>₺{reportData.expenses.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Analysis */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h4 className="text-lg font-semibold mb-4">PROFIT ANALYSIS</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">₺{Math.abs(grossProfit).toFixed(2)}</div>
              <div className="text-sm text-blue-600">Gross Profit</div>
            </div>
            <div className="text-center bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{netProfit < 0 ? '-' : ''}₺{Math.abs(netProfit).toFixed(2)}</div>
              <div className="text-sm text-green-600">Net Profit</div>
            </div>
            <div className="text-center bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">{profitMargin.toFixed(1)}%</div>
              <div className="text-sm text-purple-600">Profit Margin</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingReports;
