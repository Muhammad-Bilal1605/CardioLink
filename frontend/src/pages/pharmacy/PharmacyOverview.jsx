import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Archive,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PharmacyOverview = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    inventory: { totalProducts: 0, totalStock: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 },
    orders: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);

  useEffect(() => {
    if (user?.pharmacyId) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch inventory stats
      const inventoryStatsRes = await axios.get(
        `http://localhost:5000/api/inventory/pharmacy/${user.pharmacyId}/stats`,
        { withCredentials: true }
      );
      
      // Fetch recent orders
      const ordersRes = await axios.get(
        `http://localhost:5000/api/orders/pharmacy/${user.pharmacyId}?limit=5`,
        { withCredentials: true }
      );

      // Fetch low stock items
      const lowStockRes = await axios.get(
        `http://localhost:5000/api/inventory/pharmacy/${user.pharmacyId}/low-stock`,
        { withCredentials: true }
      );

      // Fetch expiring soon items
      const expiringSoonRes = await axios.get(
        `http://localhost:5000/api/inventory/pharmacy/${user.pharmacyId}/expiring-soon?days=90`,
        { withCredentials: true }
      );

      setStats({
        inventory: inventoryStatsRes.data.data || {},
        recentOrders: ordersRes.data.data || []
      });
      setLowStockItems(lowStockRes.data.data || []);
      setExpiringSoon(expiringSoonRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-4 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-8 h-8" style={{ color }} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-green-500 font-medium">{trend}</span>
          <span className="text-gray-500 ml-2">from last month</span>
        </div>
      )}
    </div>
  );

  const AlertCard = ({ title, items, linkTo, emptyMessage, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon className="w-5 h-5" style={{ color }} />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
          {items.length}
        </span>
      </div>
      
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      ) : (
        <>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {items.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.product?.productName}</p>
                  <p className="text-sm text-gray-600">
                    Stock: {item.stockQuantity} {item.product?.packaging?.unit}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.stockStatus === 'Out of Stock' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.stockStatus}
                </div>
              </div>
            ))}
          </div>
          <Link
            to={linkTo}
            className="mt-4 block text-center text-purple-600 hover:text-purple-700 font-medium text-sm"
          >
            View All →
          </Link>
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.inventory.totalProducts || 0}
          icon={Package}
          color="#8b5cf6"
        />
        <StatCard
          title="Total Stock"
          value={stats.inventory.totalStock || 0}
          subtitle="Items in inventory"
          icon={Archive}
          color="#06b6d4"
        />
        <StatCard
          title="Inventory Value"
          value={`Rs. ${(stats.inventory.totalValue || 0).toFixed(2)}`}
          icon={DollarSign}
          color="#10b981"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.inventory.lowStockCount || 0}
          subtitle="Needs restocking"
          icon={AlertTriangle}
          color="#ef4444"
        />
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertCard
          title="Low Stock Alerts"
          items={lowStockItems}
          linkTo="/pharmacy-dashboard/inventory?filter=low-stock"
          emptyMessage="No low stock items"
          icon={AlertTriangle}
          color="#ef4444"
        />
        <AlertCard
          title="Expiring Soon"
          items={expiringSoon}
          linkTo="/pharmacy-dashboard/inventory?filter=expiring"
          emptyMessage="No items expiring soon"
          icon={Clock}
          color="#f59e0b"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          <Link
            to="/pharmacy-dashboard/orders"
            className="text-purple-600 hover:text-purple-700 font-medium text-sm"
          >
            View All →
          </Link>
        </div>
        
        {stats.recentOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent orders</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Items</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {order.customerInfo?.fullName}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {order.items?.length} items
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      Rs. {order.pricing?.totalAmount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                        order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        order.orderStatus === 'Processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.orderStatus === 'Delivered' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {order.orderStatus === 'Cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacyOverview;

