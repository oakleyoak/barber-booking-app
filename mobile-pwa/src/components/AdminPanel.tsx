import React, { useState, useEffect } from 'react';
import { FaChartBar, FaUsers, FaCogs, FaFileAlt, FaPlus, FaEdit, FaTrash, FaSave, FaDownload } from 'react-icons/fa';
import { userManagementService, shopSettingsService } from '../services/managementServices';
import { bookingService, customerService, expenseService } from '../services/supabaseServices';

const AdminPanel = ({ currentUser }: { currentUser: { id: string } }) => {
  const [currentTab, setCurrentTab] = useState<'overview' | 'users' | 'settings' | 'reports'>('overview');
  const [shopSettings, setShopSettings] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    dailyRevenue: 0
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Barber',
    shop_name: '',
    commission_rate: 50,
    target_weekly: 2000,
    target_monthly: 8000
  });

  useEffect(() => {
    loadAdminData();
  }, [currentUser.id]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const settings = await shopSettingsService.getSettings();
      setShopSettings(settings);

      const allUsers = await userManagementService.getAllUsers();
      setUsers(allUsers);

      const [customers, monthlyEarnings, weeklyEarnings, dailyEarnings] = await Promise.all([
        customerService.getAllCustomers(),
        bookingService.getMonthlyEarnings(),
        bookingService.getWeeklyEarnings(),
        bookingService.getDailyEarnings(new Date().toISOString().split('T')[0])
      ]);

      const totalBookings = await bookingService.getAllBookings();

      setStats({
        totalBookings: totalBookings.length,
        totalCustomers: customers.length,
        monthlyRevenue: monthlyEarnings.totalAmount,
        weeklyRevenue: weeklyEarnings.totalAmount,
        dailyRevenue: dailyEarnings.totalAmount
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!shopSettings) return;
    try {
      await shopSettingsService.updateSettings(shopSettings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updated = await userManagementService.updateUser(editingUser.id, newUser);
        if (updated) {
          setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
        }
      } else {
        const created = await userManagementService.createUser({ ...newUser, password: 'changeme123' });
        if (created) {
          setUsers((prev) => [...prev, created]);
        }
      }
      setShowUserModal(false);
      setEditingUser(null);
      setNewUser({ name: '', email: '', role: 'Barber', shop_name: '', commission_rate: 50, target_weekly: 2000, target_monthly: 8000 });
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser.id) {
      alert('Cannot delete yourself!');
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      const success = await userManagementService.deleteUser(userId);
      if (success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    }
  };

  const exportReport = async (type: 'X' | 'Z') => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const bookings = await bookingService.getBookingsByDate(today);
      const report = {
        date: today,
        type,
        bookings
      };
      console.log('Report:', report);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      <div>
        <button onClick={() => setCurrentTab('overview')}>Overview</button>
        <button onClick={() => setCurrentTab('users')}>Users</button>
        <button onClick={() => setCurrentTab('settings')}>Settings</button>
        <button onClick={() => setCurrentTab('reports')}>Reports</button>
      </div>
      {currentTab === 'overview' && <div>Overview Content</div>}
      {currentTab === 'users' && <div>User Management Content</div>}
      {currentTab === 'settings' && <div>Settings Content</div>}
      {currentTab === 'reports' && <div>Reports Content</div>}
    </div>
  );
};

export default AdminPanel;
