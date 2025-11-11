import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  FileText,
  X
} from 'lucide-react';

const OrderManagement = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

  const statusOptions = [
    'All',
    'Pending',
    'Confirmed',
    'Processing',
    'Out for Delivery',
    'Delivered',
    'Cancelled'
  ];

  useEffect(() => {
    if (user?.pharmacyId) {
      fetchOrders();
    }
  }, [user, searchTerm, statusFilter, pagination.current]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== 'All' && { status: statusFilter })
      });

      const response = await axios.get(
        `http://localhost:5000/api/orders/pharmacy/${user.pharmacyId}?${params}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setOrders(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change the status to ${newStatus}?`)) return;

    try {
      const response = await axios.patch(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      if (response.data.success) {
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleViewOrder = async (order) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/orders/${order._id}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setSelectedOrder(response.data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Out for Delivery': return 'bg-blue-100 text-blue-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      case 'Confirmed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered': return CheckCircle;
      case 'Cancelled': return XCircle;
      case 'Out for Delivery': return Truck;
      case 'Processing': return Package;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
        <p className="text-gray-600">View and manage customer orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {statusOptions.map(status => (
              <option key={status} value={status === 'All' ? '' : status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">Orders will appear here once customers place them</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Items</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const StatusIcon = getStatusIcon(order.orderStatus);
                  
                  return (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{order.orderNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{order.customerInfo?.fullName}</p>
                          <p className="text-sm text-gray-600">{order.customerInfo?.phoneNumber}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900">{order.items?.length} items</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">Rs. {order.pricing?.totalAmount?.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="flex items-center px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
              disabled={pagination.current === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            
            {[...Array(pagination.pages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setPagination(prev => ({ ...prev, current: index + 1 }))}
                className={`px-3 py-2 border text-sm font-medium rounded-md ${
                  pagination.current === index + 1
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
              disabled={pagination.current === pagination.pages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
                <p className="text-sm text-gray-600">{selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Status and Actions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>
                    {selectedOrder.orderStatus}
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.orderStatus === 'Pending' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedOrder._id, 'Confirmed')}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                    >
                      Confirm Order
                    </button>
                  )}
                  {selectedOrder.orderStatus === 'Confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedOrder._id, 'Processing')}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Start Processing
                    </button>
                  )}
                  {selectedOrder.orderStatus === 'Processing' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedOrder._id, 'Out for Delivery')}
                      className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                    >
                      Ready for Delivery
                    </button>
                  )}
                  {selectedOrder.orderStatus === 'Out for Delivery' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedOrder._id, 'Delivered')}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                    >
                      Mark as Delivered
                    </button>
                  )}
                  {!['Delivered', 'Cancelled'].includes(selectedOrder.orderStatus) && (
                    <button
                      onClick={() => handleStatusUpdate(selectedOrder._id, 'Cancelled')}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-gray-900"><span className="font-medium">Name:</span> {selectedOrder.customerInfo?.fullName}</p>
                  <p className="text-gray-900"><span className="font-medium">Phone:</span> {selectedOrder.customerInfo?.phoneNumber}</p>
                  <p className="text-gray-900"><span className="font-medium">Email:</span> {selectedOrder.customerInfo?.email}</p>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Delivery Address</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900">
                    {selectedOrder.deliveryAddress?.addressLine1}{selectedOrder.deliveryAddress?.addressLine2 ? `, ${selectedOrder.deliveryAddress.addressLine2}` : ''}
                    <br />
                    {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} {selectedOrder.deliveryAddress?.postalCode}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Product</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Qty</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Price</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="py-2 px-4">
                            <p className="font-medium text-gray-900">{item.productSnapshot?.productName}</p>
                            <p className="text-sm text-gray-600">{item.productSnapshot?.strength}</p>
                          </td>
                          <td className="py-2 px-4 text-gray-900">{item.quantity}</td>
                          <td className="py-2 px-4 text-gray-900">Rs. {item.unitPrice?.toFixed(2)}</td>
                          <td className="py-2 px-4 font-medium text-gray-900">Rs. {item.subtotal?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Pricing Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items Total:</span>
                    <span className="text-gray-900">Rs. {selectedOrder.pricing?.itemsTotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="text-red-600">-Rs. {selectedOrder.pricing?.totalDiscount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Charges:</span>
                    <span className="text-gray-900">Rs. {selectedOrder.pricing?.deliveryCharges?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="text-gray-900">Rs. {selectedOrder.pricing?.taxAmount?.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-300 flex justify-between">
                    <span className="font-bold text-gray-900">Total Amount:</span>
                    <span className="font-bold text-purple-600 text-lg">Rs. {selectedOrder.pricing?.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-gray-900"><span className="font-medium">Method:</span> {selectedOrder.payment?.method}</p>
                  <p className="text-gray-900">
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedOrder.payment?.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedOrder.payment?.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

