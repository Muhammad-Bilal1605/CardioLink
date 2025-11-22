import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  Eye,
  X,
  Send
} from 'lucide-react';

const AutomaticPrescriptionOrders = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [medicationPrices, setMedicationPrices] = useState({});
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [stats, setStats] = useState({
    Pending: 0,
    Accepted: 0,
    Processing: 0,
    'Out for Delivery': 0,
    Delivered: 0,
    Rejected: 0
  });

  useEffect(() => {
    if (user?.pharmacyId) {
      fetchOrders();
      fetchStats();
    }
  }, [user, statusFilter]);

  const fetchOrders = async () => {
    if (!user?.pharmacyId) return;
    
    try {
      setLoading(true);
      const status = statusFilter === 'All' ? '' : statusFilter;
      const response = await axios.get(
        `http://localhost:5000/api/automatic-prescription-orders/pharmacy/${user.pharmacyId}?status=${status}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user?.pharmacyId) return;
    
    try {
      const response = await axios.get(
        `http://localhost:5000/api/automatic-prescription-orders/pharmacy/${user.pharmacyId}/stats`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setStats(response.data.data.statusCounts);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus, note = '') => {
    try {
      setUpdatingStatus(true);
      
      const requestData = { status: newStatus, note };
      
      // If accepting order, include pricing information
      if (newStatus === 'Accepted' && selectedOrder?.orderStatus === 'Pending') {
        const itemsTotal = Object.values(medicationPrices).reduce((sum, price) => {
          return sum + (price.subtotal || 0);
        }, 0);
        
        const totalAmount = itemsTotal + (deliveryCharges || 0) + (taxAmount || 0) - (discountAmount || 0);
        
        if (totalAmount <= 0) {
          alert('Please set prices for all medications before accepting the order');
          setUpdatingStatus(false);
          return;
        }
        
        requestData.pricing = {
          itemsTotal,
          deliveryCharges: deliveryCharges || 0,
          taxAmount: taxAmount || 0,
          discountAmount: discountAmount || 0,
          totalAmount
        };
        
        requestData.medications = selectedOrder.medications.map((med, index) => {
          const price = medicationPrices[index] || {};
          return {
            unitPrice: price.unitPrice || 0,
            quantity: price.quantity || 1,
            subtotal: price.subtotal || 0
          };
        });
      }
      
      await axios.put(
        `http://localhost:5000/api/automatic-prescription-orders/${orderId}/status`,
        requestData,
        { withCredentials: true }
      );

      // Reset pricing state
      setMedicationPrices({});
      setDeliveryCharges(0);
      setTaxAmount(0);
      setDiscountAmount(0);
      
      await fetchOrders();
      await fetchStats();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setUpdatingStatus(true);
      await axios.put(
        `http://localhost:5000/api/automatic-prescription-orders/${selectedOrder._id}/reject`,
        { reason: rejectReason },
        { withCredentials: true }
      );

      setRejectReason('');
      setShowRejectModal(false);
      setSelectedOrder(null);
      await fetchOrders();
      await fetchStats();
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Accepted: 'bg-blue-100 text-blue-800',
      Processing: 'bg-purple-100 text-purple-800',
      'Out for Delivery': 'bg-indigo-100 text-indigo-800',
      Delivered: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      Pending: Clock,
      Accepted: CheckCircle,
      Processing: Package,
      'Out for Delivery': Truck,
      Delivered: CheckCircle,
      Rejected: XCircle
    };
    return icons[status] || AlertCircle;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const OrderCard = ({ order }) => {
    const StatusIcon = getStatusIcon(order.orderStatus);

    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Patient: {order.patientId?.firstName} {order.patientId?.lastName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Created: {formatDate(order.createdAt)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.orderStatus)}`}>
            <StatusIcon className="w-3 h-3" />
            {order.orderStatus}
          </span>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Medications:</span> {order.medications?.length || 0}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            <span className="font-medium">Doctor:</span> {order.doctorId?.name || 'N/A'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedOrder(order);
              // Initialize pricing state when opening modal
              if (order.orderStatus === 'Pending' && order.medications) {
                const initialPrices = {};
                order.medications.forEach((med, index) => {
                  initialPrices[index] = {
                    unitPrice: med.unitPrice || 0,
                    quantity: med.quantity || 1,
                    subtotal: (med.unitPrice || 0) * (med.quantity || 1)
                  };
                });
                setMedicationPrices(initialPrices);
                setDeliveryCharges(order.pricing?.deliveryCharges || 0);
                setTaxAmount(order.pricing?.taxAmount || 0);
                setDiscountAmount(order.pricing?.discountAmount || 0);
              } else {
                setMedicationPrices({});
                setDeliveryCharges(0);
                setTaxAmount(0);
                setDiscountAmount(0);
              }
              setShowDetailModal(true);
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          {order.orderStatus === 'Pending' && (
            <button
              onClick={() => {
                setSelectedOrder(order);
                setShowRejectModal(true);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Automatic Prescription Orders</h1>
        <p className="text-gray-600">Manage orders automatically created from doctor prescriptions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {Object.entries(stats).map(([status, count]) => (
          <div key={status} className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-sm text-gray-600 mt-1">{status}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="All">All Orders</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Processing">Processing</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">No automatic prescription orders match your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedOrder(null);
                  // Reset pricing state when closing modal
                  setMedicationPrices({});
                  setDeliveryCharges(0);
                  setTaxAmount(0);
                  setDiscountAmount(0);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">Order Number:</span> {selectedOrder.orderNumber}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedOrder.orderStatus)}`}>
                      {selectedOrder.orderStatus}
                    </span>
                  </p>
                  <p><span className="font-medium">Created:</span> {formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>

              {/* Patient Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Patient Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedOrder.patientInfo?.fullName}</p>
                  <p><span className="font-medium">Phone:</span> {selectedOrder.patientInfo?.phoneNumber}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.patientInfo?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Medications */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Prescribed Medications</h3>
                <div className="space-y-3">
                  {selectedOrder.medications?.map((med, index) => {
                    const price = medicationPrices[index] || {
                      unitPrice: med.unitPrice || 0,
                      quantity: med.quantity || 1,
                      subtotal: med.subtotal || 0
                    };
                    
                    // Calculate subtotal if unit price or quantity changed
                    const currentSubtotal = (price.unitPrice || 0) * (price.quantity || 1);
                    
                    return (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="font-medium text-gray-900">{med.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Dosage:</span> {med.dosage} - {med.frequency}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Duration:</span> {med.durationMonths} month(s)
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Prescribed by:</span> {med.prescribedBy}
                        </p>
                        {med.reason && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Reason:</span> {med.reason}
                          </p>
                        )}
                        
                        {/* Price Input (only for Pending orders) */}
                        {selectedOrder.orderStatus === 'Pending' && (
                          <div className="mt-4 pt-4 border-t border-gray-300">
                            <p className="text-sm font-medium text-gray-700 mb-2">Set Price:</p>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-xs text-gray-600">Unit Price (Rs)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={price.unitPrice || ''}
                                  onChange={(e) => {
                                    const newPrice = parseFloat(e.target.value) || 0;
                                    const qty = price.quantity || 1;
                                    setMedicationPrices({
                                      ...medicationPrices,
                                      [index]: {
                                        ...price,
                                        unitPrice: newPrice,
                                        subtotal: newPrice * qty
                                      }
                                    });
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">Quantity</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={price.quantity || 1}
                                  onChange={(e) => {
                                    const qty = parseInt(e.target.value) || 1;
                                    const unitPrice = price.unitPrice || 0;
                                    setMedicationPrices({
                                      ...medicationPrices,
                                      [index]: {
                                        ...price,
                                        quantity: qty,
                                        subtotal: unitPrice * qty
                                      }
                                    });
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="1"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">Subtotal (Rs)</label>
                                <input
                                  type="number"
                                  value={currentSubtotal.toFixed(2)}
                                  readOnly
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-100"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Display price if order is already accepted */}
                        {selectedOrder.orderStatus !== 'Pending' && (med.unitPrice || med.subtotal) && (
                          <div className="mt-4 pt-4 border-t border-gray-300">
                            <p className="text-sm font-medium text-gray-700">Pricing:</p>
                            <div className="flex gap-4 mt-1 text-sm text-gray-600">
                              {med.unitPrice && (
                                <span>Unit Price: Rs {med.unitPrice.toFixed(2)}</span>
                              )}
                              {med.quantity && (
                                <span>Qty: {med.quantity}</span>
                              )}
                              {med.subtotal && (
                                <span className="font-medium text-gray-900">Subtotal: Rs {med.subtotal.toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Additional Pricing Fields (only for Pending orders) */}
                {selectedOrder.orderStatus === 'Pending' && (
                  <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-3">Additional Charges</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-700">Delivery Charges (Rs)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={deliveryCharges}
                          onChange={(e) => setDeliveryCharges(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700">Tax Amount (Rs)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={taxAmount}
                          onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700">Discount Amount (Rs)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700 font-medium">Total Amount (Rs)</label>
                        <div className="w-full px-3 py-2 mt-1 border border-gray-300 rounded bg-gray-100 font-semibold text-lg">
                          {(() => {
                            const itemsTotal = Object.values(medicationPrices).reduce((sum, price) => {
                              return sum + (price.subtotal || 0);
                            }, 0);
                            const total = itemsTotal + deliveryCharges + taxAmount - discountAmount;
                            return total.toFixed(2);
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Display total if order is already accepted */}
                {selectedOrder.orderStatus !== 'Pending' && selectedOrder.pricing && (
                  <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items Total:</span>
                        <span className="font-medium">Rs {selectedOrder.pricing.itemsTotal?.toFixed(2) || '0.00'}</span>
                      </div>
                      {selectedOrder.pricing.deliveryCharges > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Charges:</span>
                          <span className="font-medium">Rs {selectedOrder.pricing.deliveryCharges.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.pricing.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax:</span>
                          <span className="font-medium">Rs {selectedOrder.pricing.taxAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.pricing.discountAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount:</span>
                          <span className="font-medium text-green-600">-Rs {selectedOrder.pricing.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-green-300">
                        <span className="font-semibold text-gray-900">Total Amount:</span>
                        <span className="font-bold text-lg text-green-700">Rs {selectedOrder.pricing.totalAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Visit Info */}
              {selectedOrder.visitId && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Visit Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><span className="font-medium">Date:</span> {formatDate(selectedOrder.visitId.date)}</p>
                    <p><span className="font-medium">Provider:</span> {selectedOrder.visitId.provider}</p>
                    <p><span className="font-medium">Reason:</span> {selectedOrder.visitId.reason}</p>
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Delivery Address</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p>{selectedOrder.deliveryAddress?.addressLine1}</p>
                  {selectedOrder.deliveryAddress?.addressLine2 && (
                    <p>{selectedOrder.deliveryAddress.addressLine2}</p>
                  )}
                  <p>
                    {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} {selectedOrder.deliveryAddress?.postalCode}
                  </p>
                </div>
              </div>

              {/* Rejection Info */}
              {selectedOrder.rejection && (
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Rejection Information</h3>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <p className="text-red-900"><span className="font-medium">Reason:</span> {selectedOrder.rejection.reason}</p>
                    <p className="text-sm text-red-700 mt-1">
                      Rejected on: {formatDate(selectedOrder.rejection.rejectedAt)}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Actions */}
              {selectedOrder.orderStatus !== 'Rejected' && selectedOrder.orderStatus !== 'Delivered' && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.orderStatus === 'Pending' && (
                      <>
                        <button
                          onClick={() => {
                            // Validate that all medications have prices
                            const allPriced = selectedOrder.medications?.every((med, index) => {
                              const price = medicationPrices[index] || {};
                              return price.unitPrice > 0 && price.quantity > 0;
                            });
                            
                            if (!allPriced && selectedOrder.medications?.length > 0) {
                              alert('Please set prices for all medications before accepting the order');
                              return;
                            }
                            
                            handleStatusUpdate(selectedOrder._id, 'Accepted', 'Order accepted by pharmacy');
                          }}
                          disabled={updatingStatus}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          Accept Order
                        </button>
                        <button
                          onClick={() => {
                            setShowDetailModal(false);
                            setShowRejectModal(true);
                          }}
                          disabled={updatingStatus}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject Order
                        </button>
                      </>
                    )}
                    {selectedOrder.orderStatus === 'Accepted' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedOrder._id, 'Processing', 'Order is being processed')}
                        disabled={updatingStatus}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                      >
                        Start Processing
                      </button>
                    )}
                    {selectedOrder.orderStatus === 'Processing' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedOrder._id, 'Out for Delivery', 'Order is out for delivery')}
                        disabled={updatingStatus}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Out for Delivery
                      </button>
                    )}
                    {selectedOrder.orderStatus === 'Out for Delivery' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedOrder._id, 'Delivered', 'Order has been delivered')}
                        disabled={updatingStatus}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Reject Order</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Please provide a reason for rejecting this automatic prescription order. The patient will be notified.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="4"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleReject}
                  disabled={updatingStatus || !rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {updatingStatus ? 'Rejecting...' : 'Reject Order'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomaticPrescriptionOrders;

