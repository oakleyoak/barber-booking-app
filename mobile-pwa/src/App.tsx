import React, { useState, useEffect } from 'react';
import { User, Building, Mail, Lock, Eye, EyeOff, Calendar, TrendingUp, Users, Shield, ClipboardList, Package, AlertTriangle, DollarSign, BarChart } from 'lucide-react';
import logoIcon from './assets/edgeandcologoicon.JPG';
import largeLogo from './assets/edgeandcologo.JPG';
import { authService, userService, type User as SupabaseUser } from './services/completeDatabase';
import BookingCalendar from './components/BookingCalendar';
import RealEarningsTracker from './components/RealEarningsTracker';
import CustomerManager from './components/CustomerManager';
import AdminPanel from './components/AdminPanel';
import BookingManagement from './components/BookingManagement';
import OperationsManual from './components/OperationsManual';
import ExpenseManager from './components/ExpenseManager';
import InventoryManager from './components/InventoryManager';
import SuppliesInventory from './components/SuppliesInventory';
import IncidentReports from './components/IncidentReports';
import ModalProvider from './components/ui/ModalProvider';

function App() {
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [currentView, setCurrentView] = useState('calendar');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'Barber',
    shopName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check for saved user session on load using Supabase session service
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error loading user session:', error);
      }
    };
    initializeApp();
  }, []);

  // Authentication handler with Supabase integration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login using Supabase Auth
        if (!formData.email.includes('@') || formData.email.length < 5) {
          setError('Please enter a valid email address');
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return;
        }

        const user = await authService.loginUser(formData.email, formData.password);
        setCurrentUser(user);
        setError(''); // Clear any previous errors
      } else {
        // Registration using Supabase Auth
        if (!formData.email.includes('@') || formData.email.length < 5) {
          setError('Please enter a valid email address');
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return;
        }
        if (formData.name.length < 2) {
          setError('Please enter your full name');
          return;
        }
        if (formData.role === 'Owner' && formData.shopName.length < 2) {
          setError('Please enter your shop name');
          return;
        }

        const userData = {
          name: formData.name,
          role: formData.role as 'Owner' | 'Manager' | 'Barber' | 'Apprentice',
          shop_name: formData.role === 'Owner' ? formData.shopName : 'Edge & Co',
          // Commission rates are percentages (not fractions)
          commission_rate: formData.role === 'Owner' ? 70 : formData.role === 'Manager' ? 60 : formData.role === 'Barber' ? 40 : 30,
          target_weekly: formData.role === 'Owner' ? 3000 : formData.role === 'Manager' ? 2000 : 800,
          target_monthly: formData.role === 'Owner' ? 12000 : formData.role === 'Manager' ? 8000 : 3200
        };

        const user = await authService.registerUser(formData.email, formData.password, userData);
        setCurrentUser(user);
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      
      // Provide specific error messages for common issues
      if (err.message?.includes('Network connection error')) {
        setError('❌ Connection failed. Please check your internet connection and try again.');
      } else if (err.message?.includes('Authentication failed')) {
        setError('❌ Login failed. Please check your email and password.');
      } else if (err.message?.includes('already registered')) {
        setError('❌ This email is already registered. Please try logging in instead.');
      } else {
        setError(err.message || '❌ Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.logoutUser();
      setCurrentUser(null);
      setFormData({ email: '', password: '', name: '', role: 'Barber', shopName: '' });
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear the local state even if logout fails
      setCurrentUser(null);
      setFormData({ email: '', password: '', name: '', role: 'Barber', shopName: '' });
    }
  };

  // If user is logged in, show main app
  if (currentUser) {
    return (
      <ModalProvider>
        <div
        className="min-h-screen w-full"
        style={{
          background: `url(${largeLogo}) center/cover no-repeat fixed`,
        }}
      >
        {/* Header */}
  <div className="bg-white bg-opacity-90 shadow-sm border-b border-blue-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <img src={logoIcon} alt="Edge & Co Logo" className="h-12 w-12 object-contain mr-3 rounded-full border border-gray-200" />
                <div>
                  <h1 className="text-xl font-bold text-blue-900">Edge & Co Management</h1>
                  <p className="text-sm text-blue-700">{currentUser.shop_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {currentUser.name} ({currentUser.role})
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors border border-blue-900"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
  <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-1 sm:gap-2 mb-6">
            {/* Core Features - Available to All Users */}
            <button
              onClick={() => setCurrentView('calendar')}
              className={`flex flex-col sm:flex-row items-center justify-center px-1 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                currentView === 'calendar'
                  ? 'bg-blue-700 text-white border border-blue-900'
                  : 'bg-white text-blue-900 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              <Calendar className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
              <span className="text-center leading-tight">Calendar</span>
            </button>
            
            <button
              onClick={() => setCurrentView('earnings')}
              className={`flex flex-col sm:flex-row items-center justify-center px-1 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                currentView === 'earnings'
                  ? 'bg-red-700 text-white border border-red-900'
                  : 'bg-white text-red-900 hover:bg-red-50 border border-red-200'
              }`}
            >
              <TrendingUp className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
              <span className="text-center leading-tight">Earnings</span>
            </button>
            
            <button
              onClick={() => setCurrentView('customers')}
              className={`flex flex-col sm:flex-row items-center justify-center px-1 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                currentView === 'customers'
                  ? 'bg-blue-700 text-white border border-blue-900'
                  : 'bg-white text-blue-900 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              <Users className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
              <span className="text-center leading-tight">Customers</span>
            </button>
            
            <button
              onClick={() => setCurrentView('operations')}
              className={`flex flex-col sm:flex-row items-center justify-center px-1 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                currentView === 'operations'
                  ? 'bg-blue-700 text-white border border-blue-900'
                  : 'bg-white text-blue-900 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              <ClipboardList className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
              <span className="text-center leading-tight">Operations</span>
            </button>

            {/* Management Features - Owner/Manager/Barber Access */}
            {(currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
              <>
                <button
                  onClick={() => setCurrentView('expenses')}
                  className={`flex flex-col sm:flex-row items-center justify-center px-1 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                    currentView === 'expenses'
                      ? 'bg-blue-700 text-white border border-blue-900'
                      : 'bg-white text-blue-900 hover:bg-blue-50 border border-blue-200'
                  }`}
                >
                  <DollarSign className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
                  <span className="text-center leading-tight">Expenses</span>
                </button>
                
                <button
                  onClick={() => setCurrentView('equipment')}
                  className={`flex flex-col sm:flex-row items-center justify-center px-1 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                    currentView === 'equipment'
                      ? 'bg-blue-700 text-white border border-blue-900'
                      : 'bg-white text-blue-900 hover:bg-blue-50 border border-blue-200'
                  }`}
                >
                  <Package className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
                  <span className="text-center leading-tight">Equipment</span>
                </button>
                
                <button
                  onClick={() => setCurrentView('supplies')}
                  className={`flex flex-col sm:flex-row items-center justify-center px-1 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                    currentView === 'supplies'
                      ? 'bg-blue-700 text-white border border-blue-900'
                      : 'bg-white text-blue-900 hover:bg-blue-50 border border-blue-200'
                  }`}
                >
                  <Package className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
                  <span className="text-center leading-tight">Supplies</span>
                </button>
                
                <button
                  onClick={() => setCurrentView('incidents')}
                  className={`flex flex-col sm:flex-row items-center justify-center px-1 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                    currentView === 'incidents'
                      ? 'bg-red-700 text-white border border-red-900'
                      : 'bg-white text-red-900 hover:bg-red-50 border border-red-200'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
                  <span className="text-center leading-tight">Incidents</span>
                </button>
              </>
            )}
            
            {/* Owner-only features */}
            {currentUser?.role === 'Owner' && (
              <>
                <button
                  onClick={() => setCurrentView('bookings')}
                  className={`flex flex-col sm:flex-row items-center justify-center px-1 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                    currentView === 'bookings'
                      ? 'bg-blue-700 text-white border border-blue-900'
                      : 'bg-white text-blue-900 hover:bg-blue-50 border border-blue-200'
                  }`}
                >
                  <Calendar className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
                  <span className="text-center leading-tight">All Bookings</span>
                </button>
                
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`flex flex-col sm:flex-row items-center justify-center px-1 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                    currentView === 'admin'
                      ? 'bg-blue-700 text-white border border-blue-900'
                      : 'bg-white text-blue-900 hover:bg-blue-50 border border-blue-200'
                  }`}
                >
                  <Shield className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
                  <span className="text-center leading-tight">Admin</span>
                </button>
              </>
            )}
          </div>

          {/* Content Area */}
          <div className="bg-white bg-opacity-90 rounded-xl shadow-sm p-6">
            {currentView === 'calendar' && (
              <BookingCalendar currentUser={currentUser} />
            )}

            {currentView === 'earnings' && (
              <RealEarningsTracker currentUser={currentUser} />
            )}

            {currentView === 'customers' && (
              <CustomerManager currentUser={currentUser} />
            )}

            {currentView === 'operations' && (
              <OperationsManual />
            )}

            {currentView === 'expenses' && (currentUser?.role === 'Owner' || currentUser?.role === 'Barber') && (
              <ExpenseManager currentUserId={currentUser.id} />
            )}

            {currentView === 'equipment' && (currentUser?.role === 'Owner' || currentUser?.role === 'Barber') && (
              <InventoryManager />
            )}

            {currentView === 'supplies' && (currentUser?.role === 'Owner' || currentUser?.role === 'Barber') && (
              <SuppliesInventory />
            )}

            {currentView === 'incidents' && (currentUser?.role === 'Owner' || currentUser?.role === 'Barber') && (
              <IncidentReports currentUserId={currentUser.id} />
            )}

            {currentView === 'bookings' && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager') && (
              <BookingManagement currentUser={currentUser} />
            )}

            {currentView === 'admin' && currentUser?.role === 'Owner' && (
              <AdminPanel currentUser={currentUser} />
            )}
          </div>
        </div>
      </div>
      </ModalProvider>
    );
  }

  // Login/Register form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div
        className="rounded-xl shadow-lg p-8 w-full max-w-md relative z-10 flex flex-col items-center justify-center"
        style={{
          background: `url(${largeLogo}) center/cover no-repeat`,
          backgroundColor: 'rgba(255,255,255,0.85)',
          backgroundBlendMode: 'lighten',
        }}
      >
        <div className="text-center mb-6 bg-white bg-opacity-80 rounded-xl p-2">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Edge & Co Management</h1>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create your shop account'}
          </p>
          {!isLogin && (
            <p className="text-sm text-gray-500 mt-2">
              Complete shop management system with operations tracking.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Barber">Barber</option>
                  <option value="Owner">Owner</option>
                  <option value="Manager">Manager</option>
                  <option value="Apprentice">Apprentice</option>
                </select>
              </div>

              {formData.role === 'Owner' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your shop name"
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    required
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
