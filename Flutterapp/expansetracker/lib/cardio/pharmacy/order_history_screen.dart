import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/order_service.dart';
import '../../services/automatic_prescription_order_service.dart';
import '../../provider/auth_provider.dart';
import 'cart_screen.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({Key? key}) : super(key: key);

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  bool _isLoading = true;
  List<dynamic> _orders = [];
  String? _statusFilter;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final patientId = authProvider.userId;
    
    // Load both regular orders and automatic prescription orders
    final regularOrdersRes = await OrderService.getMyOrders(status: _statusFilter);
    final autoOrdersRes = patientId.isNotEmpty 
        ? await AutomaticPrescriptionOrderService.getPatientOrders(
            patientId: patientId,
            status: _statusFilter,
          )
        : {'success': true, 'data': []};
    
    if (!mounted) return;
    
    List<dynamic> allOrders = [];
    
    // Add regular orders
    if (regularOrdersRes['success'] == true) {
      final regularOrders = regularOrdersRes['data'] ?? [];
      allOrders.addAll(regularOrders.map((o) {
        final order = Map<String, dynamic>.from(o);
        order['orderType'] = 'regular';
        return order;
      }));
    }
    
    // Add automatic prescription orders
    if (autoOrdersRes['success'] == true) {
      final autoOrders = autoOrdersRes['data'] ?? [];
      allOrders.addAll(autoOrders.map((o) {
        final order = Map<String, dynamic>.from(o);
        order['orderType'] = 'automatic';
        return order;
      }));
    }
    
    // Sort by creation date (newest first)
    allOrders.sort((a, b) {
      final dateA = DateTime.tryParse(a['createdAt'] ?? '') ?? DateTime(1970);
      final dateB = DateTime.tryParse(b['createdAt'] ?? '') ?? DateTime(1970);
      return dateB.compareTo(dateA);
    });
    
      setState(() {
      _orders = allOrders;
        _isLoading = false;
      });
    
    if (allOrders.isEmpty && regularOrdersRes['success'] != true && autoOrdersRes['success'] != true) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load orders')),
      );
    }
  }

  Future<void> _reorder(String orderId, String pharmacyId) async {
    final res = await OrderService.reorderToCart(orderId);
    if (!mounted) return;
    if (res['success'] == true) {
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => CartScreen(pharmacyId: pharmacyId),
        ),
      );
      await _load();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message'] ?? 'Failed to reorder')),
      );
    }
  }

  Widget _buildOrderCard(
    Map<String, dynamic> o,
    String orderNumber,
    String status,
    Color statusColor,
    bool isAutomatic,
    List items,
    double total,
    String pharmacyId,
    String orderId,
  ) {
    // Track expanded state for both order types
    bool isExpanded = false;
    
    return StatefulBuilder(
      builder: (context, setState) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: isAutomatic 
                ? Border.all(color: Colors.blue.withOpacity(0.3), width: 1.5)
                : null,
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                spreadRadius: 0,
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header with order number and status
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  if (isAutomatic) ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.blue.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: Colors.blue.withOpacity(0.3)),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.auto_awesome, size: 14, color: Colors.blue[700]),
                                          const SizedBox(width: 4),
                                          Text(
                                            'AUTO',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w700,
                                              color: Colors.blue[700],
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                  ],
                                  Expanded(
                                    child: Text(
                                      orderNumber,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.grey[900],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              if (isAutomatic && o['rejection'] != null) ...[
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.red.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: Colors.red.withOpacity(0.3)),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(Icons.cancel_outlined, size: 16, color: Colors.red[700]),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          'Rejected: ${o['rejection']['reason'] ?? 'No reason provided'}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.red[700],
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            status,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: statusColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    
                    // Order details row
                    Row(
                      children: [
                        Icon(
                          isAutomatic ? Icons.medication_liquid : Icons.shopping_bag_outlined,
                          size: 16,
                          color: Colors.grey[600],
                        ),
                        const SizedBox(width: 6),
                        Text(
                          isAutomatic
                              ? '${items.length} medication${items.length != 1 ? 's' : ''}'
                              : '${items.length} item${items.length != 1 ? 's' : ''}',
                          style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                        ),
                        const Spacer(),
                        if (total > 0)
                          Text(
                            'Rs ${total.toStringAsFixed(2)}',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: isAutomatic ? Colors.blue[700] : Colors.green[700],
                            ),
                          )
                        else if (isAutomatic)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Price Pending',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.orange[700],
                              ),
                            ),
                          ),
                      ],
                    ),
                    
                    // Pharmacy info for both order types
                    if (o['pharmacy'] != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.local_pharmacy, size: 14, color: Colors.grey[600]),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              o['pharmacy'] is Map
                                  ? o['pharmacy']['pharmacyName'] ?? 'Pharmacy'
                                  : 'Pharmacy',
                              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                    
                    // Visit/Doctor info for automatic orders
                    if (isAutomatic && o['visitId'] != null) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(Icons.medical_services_outlined, size: 14, color: Colors.grey[600]),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              o['visitId'] is Map
                                  ? 'Visit: ${o['visitId']['provider'] ?? 'Doctor'} - ${_formatDate(o['visitId']['date'])}'
                                  : 'Prescribed by Doctor',
                              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                    
                    // Pricing summary for automatic orders (if accepted)
                    if (isAutomatic && o['pricing'] != null && o['pricing']['totalAmount'] != null && o['pricing']['totalAmount'] > 0) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.blue.withOpacity(0.2)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Order Total:',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.grey[900],
                                  ),
                                ),
                                Text(
                                  'Rs ${o['pricing']['totalAmount'].toStringAsFixed(2)}',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.blue[700],
                                  ),
                                ),
                              ],
                            ),
                            if (o['pricing']['itemsTotal'] != null && o['pricing']['itemsTotal'] > 0) ...[
                              const SizedBox(height: 4),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Items:',
                                    style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                                  ),
                                  Text(
                                    'Rs ${o['pricing']['itemsTotal'].toStringAsFixed(2)}',
                                    style: TextStyle(fontSize: 11, color: Colors.grey[700]),
                                  ),
                                ],
                              ),
                            ],
                            if (o['pricing']['deliveryCharges'] != null && o['pricing']['deliveryCharges'] > 0) ...[
                              const SizedBox(height: 2),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Delivery:',
                                    style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                                  ),
                                  Text(
                                    'Rs ${o['pricing']['deliveryCharges'].toStringAsFixed(2)}',
                                    style: TextStyle(fontSize: 11, color: Colors.grey[700]),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                    
                    // Expandable details for both order types
                    if (items.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      InkWell(
                        onTap: () => setState(() => isExpanded = !isExpanded),
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: isAutomatic ? Colors.blue.withOpacity(0.05) : Colors.green.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isAutomatic 
                                  ? Colors.blue.withOpacity(0.3) 
                                  : Colors.green.withOpacity(0.3),
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                isAutomatic ? Icons.medication : Icons.shopping_bag,
                                size: 16,
                                color: isAutomatic ? Colors.blue[700] : Colors.green[700],
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  isAutomatic
                                      ? 'View Medications (${items.length})'
                                      : 'View Items (${items.length})',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: isAutomatic ? Colors.blue[700] : Colors.green[700],
                                  ),
                                ),
                              ),
                              Icon(
                                isExpanded ? Icons.expand_less : Icons.expand_more,
                                size: 20,
                                color: isAutomatic ? Colors.blue[700] : Colors.green[700],
                              ),
                            ],
                          ),
                        ),
                      ),
                      
                      // Expanded item list
                      if (isExpanded) ...[
                        const SizedBox(height: 8),
                        ...items.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final item = entry.value as Map<String, dynamic>;
                          
                          if (isAutomatic) {
                            // Automatic order medication details
                            return Container(
                              margin: EdgeInsets.only(bottom: idx < items.length - 1 ? 8 : 0),
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.blue.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.blue.withOpacity(0.2)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(Icons.medication_liquid, size: 16, color: Colors.blue[700]),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          item['name'] ?? 'Unknown Medication',
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.grey[900],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (item['dosage'] != null) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      'Dosage: ${item['dosage']}',
                                      style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                                    ),
                                  ],
                                  if (item['frequency'] != null) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      'Frequency: ${item['frequency']}',
                                      style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                                    ),
                                  ],
                                  if (item['reason'] != null && item['reason'].toString().isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      'Reason: ${item['reason']}',
                                      style: TextStyle(fontSize: 11, color: Colors.grey[600], fontStyle: FontStyle.italic),
                                    ),
                                  ],
                                  if (item['durationMonths'] != null) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      'Duration: ${item['durationMonths']} month${item['durationMonths'] != 1 ? 's' : ''}',
                                      style: TextStyle(fontSize: 11, color: Colors.blue[700], fontWeight: FontWeight.w500),
                                    ),
                                  ],
                                ],
                              ),
                            );
                          } else {
                            // Regular order item details
                            final productSnapshot = item['productSnapshot'] as Map<String, dynamic>?;
                            final productName = productSnapshot?['productName'] ?? 
                                              (item['product'] is Map ? item['product']['productName'] : null) ??
                                              'Product';
                            final brandName = productSnapshot?['brandName'] ?? '';
                            final genericName = productSnapshot?['genericName'] ?? '';
                            final strength = productSnapshot?['strength'] ?? '';
                            final manufacturer = productSnapshot?['manufacturer'] ?? '';
                            final packaging = productSnapshot?['packaging'] as Map<String, dynamic>?;
                            final packSize = packaging?['packSize'] ?? '';
                            final unit = packaging?['unit'] ?? '';
                            final dosageForm = productSnapshot?['dosageForm'] ?? '';
                            final quantity = item['quantity'] ?? 0;
                            final unitPrice = (item['unitPrice'] ?? 0).toDouble();
                            final subtotal = (item['subtotal'] ?? 0).toDouble();
                            final discountAmount = (item['discountAmount'] ?? 0).toDouble();
                            final prescriptionRequired = item['prescriptionRequired'] ?? false;
                            
                            return Container(
                              margin: EdgeInsets.only(bottom: idx < items.length - 1 ? 8 : 0),
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.green.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.green.withOpacity(0.2)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Icon(Icons.medication, size: 16, color: Colors.green[700]),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              productName,
                                              style: TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w600,
                                                color: Colors.grey[900],
                                              ),
                                            ),
                                            if (brandName.isNotEmpty) ...[
                                              const SizedBox(height: 2),
                                              Text(
                                                'Brand: $brandName',
                                                style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                                              ),
                                            ],
                                            if (genericName.isNotEmpty) ...[
                                              const SizedBox(height: 2),
                                              Text(
                                                'Generic: $genericName',
                                                style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 4,
                                    children: [
                                      if (strength.isNotEmpty)
                                        _buildDetailChip('Strength: $strength', Colors.grey[700]!),
                                      if (dosageForm.isNotEmpty)
                                        _buildDetailChip('Form: $dosageForm', Colors.grey[700]!),
                                      if (packSize.isNotEmpty && unit.isNotEmpty)
                                        _buildDetailChip('Pack: $packSize $unit', Colors.grey[700]!),
                                      if (manufacturer.isNotEmpty)
                                        _buildDetailChip('Mfg: $manufacturer', Colors.grey[700]!),
                                      if (prescriptionRequired)
                                        _buildDetailChip('Rx Required', Colors.orange[700]!),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Qty: $quantity',
                                        style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                                      ),
                                      Text(
                                        'Rs ${unitPrice.toStringAsFixed(2)} each',
                                        style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                                      ),
                                      if (discountAmount > 0)
                                        Text(
                                          'Discount: Rs ${discountAmount.toStringAsFixed(2)}',
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: Colors.green[700],
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Subtotal:',
                                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                                      ),
                                      Text(
                                        'Rs ${subtotal.toStringAsFixed(2)}',
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.green[700],
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          }
                        }).toList(),
                      ],
                    ],
                    
                    // Reorder button for regular orders only
                    if (!isAutomatic) ...[
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.refresh, size: 18),
                          label: const Text('Reorder', style: TextStyle(fontWeight: FontWeight.w600)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green[600],
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            elevation: 0,
                          ),
                          onPressed: pharmacyId.isEmpty ? null : () => _reorder(orderId, pharmacyId),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _formatDate(dynamic date) {
    if (date == null) return '';
    try {
      final dateStr = date.toString();
      final parsed = DateTime.parse(dateStr);
      return '${parsed.day}/${parsed.month}/${parsed.year}';
    } catch (e) {
      return date.toString();
    }
  }

  Widget _buildDetailChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          color: color,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.green[700],
        title: const Text('My Orders', style: TextStyle(fontWeight: FontWeight.w600)),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            onSelected: (v) {
              setState(() => _statusFilter = v == 'All' ? null : v);
              _load();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'All', child: Text('All')),
              const PopupMenuItem(value: 'Pending', child: Text('Pending')),
              const PopupMenuItem(value: 'Processing', child: Text('Processing')),
              const PopupMenuItem(value: 'Completed', child: Text('Completed')),
              const PopupMenuItem(value: 'Delivered', child: Text('Delivered')),
              const PopupMenuItem(value: 'Cancelled', child: Text('Cancelled')),
              const PopupMenuItem(value: 'Rejected', child: Text('Rejected')),
            ],
          )
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: Colors.green[700]))
          : _orders.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.receipt_long_outlined, size: 80, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'No orders yet',
                        style: TextStyle(fontSize: 18, color: Colors.grey[600], fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: Colors.green[700],
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: _orders.length,
                    itemBuilder: (context, i) {
                      final o = _orders[i] as Map<String, dynamic>;
                      final orderType = o['orderType'] ?? 'regular';
                      final orderId = o['_id']?.toString() ?? '';
                      final orderNumber = o['orderNumber'] ?? orderId;
                      final status = o['orderStatus'] ?? 'Pending';
                      final isAutomatic = orderType == 'automatic';
                      
                      // For both order types, get total from pricing
                      final total = isAutomatic 
                          ? (o['pricing']?['totalAmount'] ?? 0).toDouble()
                          : (o['pricing']?['totalAmount'] ?? 0).toDouble();
                      final items = isAutomatic 
                          ? List.from(o['medications'] ?? [])
                          : List.from(o['items'] ?? []);
                      final pharmacyId = o['pharmacy']?.toString() ?? o['pharmacyId']?.toString() ?? '';
                      
                      Color statusColor = Colors.grey;
                      if (status == 'Completed' || status == 'Delivered') statusColor = Colors.green;
                      else if (status == 'Processing' || status == 'Accepted') statusColor = Colors.blue;
                      else if (status == 'Cancelled' || status == 'Rejected') statusColor = Colors.red;
                      else if (status == 'Pending') statusColor = Colors.orange;
                      else if (status == 'Out for Delivery') statusColor = Colors.indigo;
                      
                      return _buildOrderCard(
                        o,
                                      orderNumber,
                                      status,
                        statusColor,
                        isAutomatic,
                        items,
                        total,
                        pharmacyId,
                        orderId,
                      );
                    },
                  ),
                ),
    );
  }
}


