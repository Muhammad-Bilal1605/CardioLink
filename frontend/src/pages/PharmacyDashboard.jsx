import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Archive,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  LogOut,
  Menu,
  X,
  Pill,
  Bell
} from 'lucide-react';
import ProductManagement from './pharmacy/ProductManagement';
import InventoryManagement from './pharmacy/InventoryManagement';
import OrderManagement from './pharmacy/OrderManagement';
import PharmacyOverview from './pharmacy/PharmacyOverview';

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch notifications (low stock, new orders, etc.)
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    // Placeholder for fetching notifications
    // Will fetch low stock alerts, new orders, etc.
  };

  const handleLogout = () => {
    logout();
    navigate('/pharmacy-login');
  };

  const menuItems = [
    {
      name: 'Overview',
      path: '/pharmacy-dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      name: 'Products',
      path: '/pharmacy-dashboard/products',
      icon: Package,
      badge: null
    },
    {
      name: 'Inventory',
      path: '/pharmacy-dashboard/inventory',
      icon: Archive,
      badge: notifications.lowStockCount || null
    },
    {
      name: 'Orders',
      path: '/pharmacy-dashboard/orders',
      icon: ShoppingCart,
      badge: notifications.newOrdersCount || null
    }
  ];

  const isActivePath = (path) => {
    if (path === '/pharmacy-dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-purple-800 to-purple-900 text-white transition-all duration-300 flex flex-col fixed h-full z-50`}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-purple-700">
          {isSidebarOpen && (
            <div className="flex items-center space-x-2">
              <Pill className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-lg font-bold">Pharmacy Portal</h1>
                <p className="text-xs text-purple-300">{user?.pharmacyName}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center ${
                  isSidebarOpen ? 'justify-between' : 'justify-center'
                } p-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-700 shadow-lg'
                    : 'hover:bg-purple-700/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  {isSidebarOpen && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </div>
                {isSidebarOpen && item.badge && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-purple-700">
          <button
            onClick={handleLogout}
            className={`flex items-center ${
              isSidebarOpen ? 'justify-start space-x-3' : 'justify-center'
            } w-full p-3 rounded-lg hover:bg-purple-700 transition-colors`}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {menuItems.find(item => isActivePath(item.path))?.name || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-6 h-6 text-gray-600" />
                {(notifications.lowStockCount || notifications.newOrdersCount) && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          <Routes>
            <Route index element={<PharmacyOverview />} />
            <Route path="products/*" element={<ProductManagement />} />
            <Route path="inventory/*" element={<InventoryManagement />} />
            <Route path="orders/*" element={<OrderManagement />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;

