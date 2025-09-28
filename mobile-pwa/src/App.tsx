import React, { useState, useEffect } from 'react';
import { User, Building, Mail, Lock, Eye, EyeOff, Calendar, TrendingUp, Users, Shield, ClipboardList, Package, AlertTriangle, DollarSign, BarChart, Globe, Menu, X } from 'lucide-react';
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
import LanguageSelector from './i18n/LanguageSelector';
import { useLanguage } from './i18n/LanguageContext';

function App() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [currentView, setCurrentView] = useState('calendar');
  const [hasModalOpen, setHasModalOpen] = useState(false);
  const [userNavPreference, setUserNavPreference] = useState(true);
  const [forceNavVisible, setForceNavVisible] = useState(false); // allow manual override when modal open
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'Barber'
  });

  // Computed navigation visibility:
  // - When no modal is open -> follow userNavPreference
  // - When a modal is open -> follow forceNavVisible (manual override), default hidden
  const isNavVisible = hasModalOpen ? !!forceNavVisible : !!userNavPreference;
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
        <div className="min-h-screen flex flex-col relative bg-transparent">
          {/* Branded background image for the entire app */}
          <div aria-hidden="true" className="fixed inset-0 -z-50">
            <div className="absolute inset-0 -z-50 opacity-20 app-bg" />
          </div>
          {/* Header - always visible so users can toggle navigation */}
          <div className="bg-white/40 shadow-lg border-b border-gray-200/30 w-full z-40 flex items-center px-2 py-2 sm:px-4 sm:py-3 transition-transform duration-200 h-12 sm:h-16 header-top relative">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <img src={logoIcon} alt="Edge & Co Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-full border-2 border-blue-200 shadow-md" />
                <div>
                  <h1 className="text-base sm:text-lg font-bold brand-text-gradient">Edge & Co</h1>
                  <p className="text-xs text-blue-700 font-medium">{currentUser.shop_name}</p>
                </div>
              </div>
              {/* Top-right controls inside header */}
              <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => {
                    if (hasModalOpen) {
                      setForceNavVisible(!forceNavVisible);
                    } else {
                      setUserNavPreference(!userNavPreference);
                    }
                  }}
                  className="text-gray-600 hover:text-gray-800 p-1 sm:p-2 rounded-md hover:bg-gray-100 transition-colors border border-gray-300 bg-white/80 backdrop-blur"
                  title={isNavVisible ? "Hide Navigation" : "Show Navigation"}
                  aria-label={isNavVisible ? "Hide Navigation" : "Show Navigation"}
                >
                  {isNavVisible ? <X className="h-3 w-3 sm:h-4 sm:w-4" /> : <Menu className="h-3 w-3 sm:h-4 sm:w-4" />}
                </button>
                <LanguageSelector className="w-24 sm:w-32" />
                <span className="text-xs text-gray-700 bg-white/80 px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                  {currentUser.name} ({currentUser.role})
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md hover:bg-gray-100 transition-colors text-xs border border-gray-300 bg-white/80 backdrop-blur"
                >
                  Sign Out
                </button>
              </div>
            </div>
          {/* Navigation - block below header, always pushes content down, horizontally scrollable if needed */}
          {(isNavVisible || forceNavVisible) && (
            <nav className="bg-white/30 border-b border-gray-200/20 w-full z-30 shadow-sm transition-all duration-300 ease-in-out flex justify-center">
              <div className="w-full max-w-3xl mx-auto px-2 py-3">
                {/* Responsive 2x5 grid for nav on large screens, 1-row scroll on mobile */}
                <div className="w-full">
                  <div className="grid grid-cols-5 grid-rows-2 gap-2 md:gap-3 whitespace-nowrap min-w-max md:max-w-2xl mx-auto md:grid-flow-row">
                    {/* Core Features - Available to All Users */}
                    <button
                      onClick={() => setCurrentView('calendar')}
                      className={`flex flex-col items-center justify-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-colors text-xs w-full ${
                        currentView === 'calendar'
                          ? 'bg-blue-700 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
                      <span className="text-center leading-tight">Calendar</span>
                    </button>
                    {/* All Bookings - show to Owner/Manager/Barber and place next to Calendar */}
                    {(currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                      <button
                        onClick={() => setCurrentView('bookings')}
                        className={`flex flex-col items-center justify-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-colors text-xs w-full ${
                          currentView === 'bookings'
                            ? 'bg-blue-700 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
                        <span className="text-center leading-tight">All Bookings</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => setCurrentView('earnings')}
                      className={`flex flex-col items-center justify-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-colors text-xs w-full ${
                        currentView === 'earnings'
                          ? 'bg-red-700 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
                      <span className="text-center leading-tight">Earnings</span>
                    </button>
                    
                    <button
                      onClick={() => setCurrentView('customers')}
                      className={`flex flex-col items-center justify-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-colors text-xs w-full ${
                        currentView === 'customers'
                          ? 'bg-blue-700 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
                      <span className="text-center leading-tight">Customers</span>
                    </button>
                    
                    <button
                      onClick={() => setCurrentView('operations')}
                      className={`flex flex-col items-center justify-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-colors text-xs min-w-[60px] sm:min-w-[70px] ${
                        currentView === 'operations'
                          ? 'bg-blue-700 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
                      <span className="text-center leading-tight">Operations</span>
                    </button>

                    {/* Management Features - Owner/Manager/Barber Access */}
                    {(currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                      <>
                        <button
                          onClick={() => setCurrentView('expenses')}
                          className={`flex flex-col items-center justify-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-colors text-xs w-full ${
                            currentView === 'expenses'
                              ? 'bg-blue-700 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
                          <span className="text-center leading-tight">Expenses</span>
                        </button>
                        
                        <button
                          onClick={() => setCurrentView('equipment')}
                          className={`flex flex-col items-center justify-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-colors text-xs w-full ${
                            currentView === 'equipment'
                              ? 'bg-blue-700 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Package className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
                          <span className="text-center leading-tight">Equipment</span>
                        </button>
                        
                        <button
                          onClick={() => setCurrentView('supplies')}
                          className={`flex flex-col items-center justify-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-colors text-xs w-full ${
                            currentView === 'supplies'
                              ? 'bg-blue-700 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Package className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
                          <span className="text-center leading-tight">Supplies</span>
                        </button>
                        
                        <button
                          onClick={() => setCurrentView('incidents')}
                          className={`flex flex-col items-center justify-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-colors text-xs w-full ${
                            currentView === 'incidents'
                              ? 'bg-red-700 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
                          <span className="text-center leading-tight">Incidents</span>
                        </button>
                      </>
                    )}
                    
                    {/* Owner, Manager and Barber features */}
                    {(currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                      <button
                        onClick={() => setCurrentView('admin')}
                        className={`flex flex-col items-center justify-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-colors text-xs w-full ${
                          currentView === 'admin'
                            ? 'bg-blue-700 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Shield className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
                        <span className="text-center leading-tight">Admin</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </nav>
          )}
          {/* Content Area - add top margin to clear header and nav */}
          <main className="flex-1 overflow-auto">
            <div className="w-full max-w-2xl lg:max-w-3xl mx-auto p-1 sm:p-2 lg:p-4 mt-2 sm:mt-4">
              <div className="brand-card rounded-xl p-1 sm:p-3 lg:p-6">
                {currentView === 'calendar' && (
                  <BookingCalendar currentUser={currentUser!} />
                )}

                {currentView === 'earnings' && (
                  <RealEarningsTracker currentUser={currentUser!} />
                )}

                {currentView === 'customers' && (
                  <CustomerManager currentUser={currentUser!} />
                )}

                {currentView === 'operations' && (
                  <OperationsManual />
                )}

                {currentView === 'expenses' && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                  <ExpenseManager currentUserId={(currentUser as import('./services/completeDatabase').User).id} />
                )}

                {currentView === 'equipment' && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                  <InventoryManager />
                )}

                {currentView === 'supplies' && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                  <SuppliesInventory />
                )}

                {currentView === 'incidents' && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                  <IncidentReports currentUserId={(currentUser as import('./services/completeDatabase').User).id} />
                )}

                {currentView === 'bookings' && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || currentUser?.role === 'Barber') && (
                  <BookingManagement 
                    currentUser={currentUser!} 
                    onModalStateChange={(isOpen) => setHasModalOpen(isOpen)} 
                  />
                )}

                {currentView === 'admin' && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager') && (
                  <AdminPanel currentUser={currentUser!} />
                )}
              </div>
            </div>
          </main>
        </div>
      </ModalProvider>
    );
  }

  // Login/Register form
  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 relative overflow-hidden app-bg-login">
      {/* Branded background image */}
      <div className="rounded-xl shadow-xl p-4 sm:p-6 lg:p-8 w-full max-w-sm sm:max-w-md relative z-10 bg-white/90 backdrop-blur-md border border-white/20">
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex justify-center mb-2 sm:mb-4">
            <img src={logoIcon} alt="Edge & Co Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-full border-2 border-blue-200 shadow-lg" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Edge & Co</h1>
          <p className="text-gray-600 font-medium text-sm sm:text-base">
            Professional Barbershop Management
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
            {isLogin ? 'Sign in to your account' : 'Create your shop account'}
          </p>
          {!isLogin && (
            <p className="text-xs text-gray-400 mt-1">
              Complete shop management system with operations tracking
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-8 sm:pl-10 pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  aria-label="User role"
                  title="Select user role"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                className="w-full pl-8 sm:pl-10 pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                aria-label="Email address"
              />
              {isLogin ? (
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  aria-label="Current password"
                />
              ) : (
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  aria-label="New password"
                />
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>
          {error && (
            <div className="text-red-600 text-xs sm:text-sm text-center bg-red-50 p-1 sm:p-2 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full brand-button text-white py-2 sm:py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm sm:text-base"
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
              className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
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
