import React, { useState, useEffect } from 'react';
import { User, Building, Mail, Lock, Eye, EyeOff, Calendar, TrendingUp, Users, Shield, ClipboardList, Package, AlertTriangle, DollarSign, BarChart } from 'lucide-react';
import logoIcon from './assets/BWicon.png';
import largeLogo from './assets/edgeandcoblackandwhitelogobackground.png';
import { supabase } from './lib/supabase';
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
    role: 'Barber'
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

        const userData = {
          name: formData.name,
          email: formData.email,
          role: formData.role as 'Owner' | 'Manager' | 'Barber' | 'Apprentice',
          shop_name: 'Edge & Co', // Always Edge & Co since this is shop-specific app
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
      setFormData({ email: '', password: '', name: '', role: 'Barber' });
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear the local state even if logout fails
      setCurrentUser(null);
      setFormData({ email: '', password: '', name: '', role: 'Barber' });
    }
  };

  // If user is logged in, show main app
  if (currentUser) {
    return (
      <ModalProvider>
  <div className="min-h-screen flex flex-col bg-gray-50 relative">
          {/* Decorative centered background image (non-distorting) */}
          {/* Fullscreen decorative background image behind all content */}
          <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
            <img src={largeLogo} alt="" className="absolute inset-0 w-full h-full object-cover" />
            {/* Slightly stronger overlay so foreground remains readable */}
            <div className="absolute inset-0 bg-black/55" />
          </div>

          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-full px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <img src={logoIcon} alt="Edge & Co Logo" className="h-10 w-10 object-contain rounded-full border border-gray-200" />
                  <div>
                    <h1 className="text-lg font-bold text-blue-900">Edge & Co</h1>
                    <p className="text-xs text-blue-700">{currentUser.shop_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-700">
                    {currentUser.name} ({currentUser.role})
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-600 hover:text-gray-800 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors text-xs border border-gray-300"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation - responsive grid (mobile-first 3 columns) */}
          <div className="bg-white border-b border-gray-200 sticky top-[73px] z-40">
            <div className="max-w-full px-2 py-3">
              <div className="w-full">
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2 auto-rows-min">
                  {/* Core Features - Available to All Users */}
                  <button
                    onClick={() => setCurrentView('calendar')}
                    className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors text-xs w-full ${
                      currentView === 'calendar'
                        ? 'bg-blue-700 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Calendar className="h-4 w-4 mb-1" />
                    <span className="text-center leading-tight">Calendar</span>
                  </button>
                  {/* All Bookings - show to Owner/Manager/Barber and place next to Calendar */}
                  {(currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                    <button
                      onClick={() => setCurrentView('bookings')}
                      className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors text-xs w-full ${
                        currentView === 'bookings'
                          ? 'bg-blue-700 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Calendar className="h-4 w-4 mb-1" />
                      <span className="text-center leading-tight">All Bookings</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setCurrentView('earnings')}
                    className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors text-xs w-full ${
                      currentView === 'earnings'
                        ? 'bg-red-700 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4 mb-1" />
                    <span className="text-center leading-tight">Earnings</span>
                  </button>
                  
                  <button
                    onClick={() => setCurrentView('customers')}
                    className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors text-xs w-full ${
                      currentView === 'customers'
                        ? 'bg-blue-700 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Users className="h-4 w-4 mb-1" />
                    <span className="text-center leading-tight">Customers</span>
                  </button>
                  
                  <button
                    onClick={() => setCurrentView('operations')}
                    className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors text-xs min-w-[70px] ${
                      currentView === 'operations'
                        ? 'bg-blue-700 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <ClipboardList className="h-4 w-4 mb-1" />
                    <span className="text-center leading-tight">Operations</span>
                  </button>

                  {/* Management Features - Owner/Manager/Barber Access */}
                  {(currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                    <>
                      <button
                        onClick={() => setCurrentView('expenses')}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors text-xs w-full ${
                          currentView === 'expenses'
                            ? 'bg-blue-700 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <DollarSign className="h-4 w-4 mb-1" />
                        <span className="text-center leading-tight">Expenses</span>
                      </button>
                      
                      <button
                        onClick={() => setCurrentView('equipment')}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors text-xs w-full ${
                          currentView === 'equipment'
                            ? 'bg-blue-700 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Package className="h-4 w-4 mb-1" />
                        <span className="text-center leading-tight">Equipment</span>
                      </button>
                      
                      <button
                        onClick={() => setCurrentView('supplies')}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors text-xs w-full ${
                          currentView === 'supplies'
                            ? 'bg-blue-700 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Package className="h-4 w-4 mb-1" />
                        <span className="text-center leading-tight">Supplies</span>
                      </button>
                      
                      <button
                        onClick={() => setCurrentView('incidents')}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors text-xs w-full ${
                          currentView === 'incidents'
                            ? 'bg-red-700 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <AlertTriangle className="h-4 w-4 mb-1" />
                        <span className="text-center leading-tight">Incidents</span>
                      </button>
                    </>
                  )}
                  
                  {/* Owner, Manager and Barber features */}
                  {(currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                    <>
                      <button
                        onClick={() => setCurrentView('admin')}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors text-xs w-full ${
                          currentView === 'admin'
                            ? 'bg-blue-700 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Shield className="h-4 w-4 mb-1" />
                        <span className="text-center leading-tight">Admin</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-full p-4">
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
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

                {currentView === 'expenses' && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                  <ExpenseManager currentUserId={currentUser.id} />
                )}

                {currentView === 'equipment' && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                  <InventoryManager />
                )}

                {currentView === 'supplies' && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                  <SuppliesInventory />
                )}

                {currentView === 'incidents' && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                  <IncidentReports currentUserId={currentUser.id} />
                )}

                {currentView === 'bookings' && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                  <BookingManagement currentUser={currentUser} />
                )}

                {currentView === 'admin' && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager') && (
                  <AdminPanel currentUser={currentUser} />
                )}
              </div>
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
                placeholder={isLogin ? 'Enter your password' : 'Create a password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
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
