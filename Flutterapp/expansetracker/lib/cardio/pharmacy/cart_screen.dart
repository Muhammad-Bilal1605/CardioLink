import 'package:flutter/material.dart';
import '../../services/cart_service.dart';
import 'checkout_screen.dart';

class CartScreen extends StatefulWidget {
  final String pharmacyId;

  const CartScreen({Key? key, required this.pharmacyId}) : super(key: key);

  @override
  _CartScreenState createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  Map<String, dynamic> _cart = {};
  bool _isLoading = true;

  Map<String, dynamic> _initialCart() {
    return {
      'id': null,
      'pharmacyId': widget.pharmacyId,
      'pharmacy': null,
      'items': <Map<String, dynamic>>[],
      'itemCount': 0,
      'itemsTotal': 0.0,
      'totalDiscount': 0.0,
      'deliveryCharges': 0.0,
      'taxAmount': 0.0,
      'totalAmount': 0.0,
      'requiresPrescription': false,
      'appliedCoupon': null,
    };
  }

  @override
  void initState() {
    super.initState();
    _cart = _initialCart();
    _loadCart();
  }

  double _parseDouble(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }
    return 0.0;
  }

  Future<void> _loadCart({bool showError = false}) async {
    setState(() => _isLoading = true);

    final result = await CartService.getCart(widget.pharmacyId);
    if (!mounted) return;

    if (result['success'] == true) {
      setState(() {
        _cart = Map<String, dynamic>.from(result['data'] ?? _initialCart());
        _isLoading = false;
      });
    } else {
      setState(() {
        _cart = Map<String, dynamic>.from(result['data'] ?? _initialCart());
        _isLoading = false;
      });
      if (showError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] ?? 'Failed to load cart')),
        );
      }
    }
  }

  Future<void> _updateQuantity(String productId, int newQuantity) async {
    setState(() => _isLoading = true);

    final result = await CartService.updateItemQuantity(
      pharmacyId: widget.pharmacyId,
      productId: productId,
      quantity: newQuantity,
    );

    if (!mounted) return;

    if (result['success'] == true) {
      setState(() {
        _cart = Map<String, dynamic>.from(result['data'] ?? _initialCart());
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Failed to update cart')),
      );
    }
  }

  Future<void> _removeItem(String productId) async {
    setState(() => _isLoading = true);

    final result = await CartService.removeItem(
      pharmacyId: widget.pharmacyId,
      productId: productId,
    );

    if (!mounted) return;

    if (result['success'] == true) {
      setState(() {
        _cart = Map<String, dynamic>.from(result['data'] ?? _initialCart());
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Failed to remove item')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = List<Map<String, dynamic>>.from(_cart['items'] ?? []);
    final itemsTotal = _parseDouble(_cart['itemsTotal']);
    final totalDiscount = _parseDouble(_cart['totalDiscount']);
    final deliveryCharges = _parseDouble(_cart['deliveryCharges']);
    final taxAmount = _parseDouble(_cart['taxAmount']);
    final totalAmount = _parseDouble(_cart['totalAmount']);
    final cartId = _cart['id'] as String?;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.green[700],
        title: const Text('Your Cart', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: Colors.green[700]))
          : items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.shopping_cart_outlined, size: 80, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'Your cart is empty',
                        style: TextStyle(fontSize: 18, color: Colors.grey[600], fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green[600],
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text('Continue Shopping', style: TextStyle(fontSize: 15, color: Colors.white)),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    Expanded(
                      child: ListView.builder(
                        itemCount: items.length,
                        itemBuilder: (context, index) {
                          final item = items[index];
                          final product = item['product'] ?? {};
                          final images = product['images'] ?? {};
                          final imageUrl = images['primary'] ?? images['secondary']?[0];
                          final quantity = (item['quantity'] ?? 0) as int;
                          final price = _parseDouble(item['price']);
                          final availableRaw = item['availableQuantity'] ?? 0;
                          final availableQuantity = availableRaw is num ? availableRaw.toInt() : 0;

                          return Container(
                            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.grey.withOpacity(0.08),
                                  spreadRadius: 0,
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(12.0),
                              child: Row(
                                children: [
                                  Container(
                                    width: 65,
                                    height: 65,
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [Colors.grey[100]!, Colors.grey[50]!],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                      borderRadius: BorderRadius.circular(10),
                                      image: imageUrl != null
                                          ? DecorationImage(
                                              image: NetworkImage(imageUrl),
                                              fit: BoxFit.cover,
                                              onError: (_, __) {},
                                            )
                                          : null,
                                    ),
                                    child: imageUrl == null
                                        ? Icon(Icons.medication, size: 30, color: Colors.grey[400])
                                        : null,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          product['productName'] ?? 'Unknown Product',
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '₹${price.toStringAsFixed(2)}',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.green[700],
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Available: $availableQuantity',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: availableQuantity > 0
                                                ? (availableQuantity < quantity ? Colors.orange : Colors.grey[600])
                                                : Colors.red,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Subtotal: ₹${_parseDouble(item['subtotal']).toStringAsFixed(2)}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: Colors.black54,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.remove_circle_outline),
                                        onPressed: quantity > 1
                                            ? () => _updateQuantity(item['productId'], quantity - 1)
                                            : null,
                                      ),
                                      Text(
                                        quantity.toString(),
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.add_circle_outline),
                                        onPressed: () {
                                          if (availableQuantity > 0 && quantity >= availableQuantity) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(
                                                content: Text('Only $availableQuantity unit(s) available'),
                                              ),
                                            );
                                          } else {
                                            _updateQuantity(item['productId'], quantity + 1);
                                          }
                                        },
                                      ),
                                    ],
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                                    onPressed: () => _removeItem(item['productId']),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.grey.withOpacity(0.15),
                            spreadRadius: 0,
                            blurRadius: 12,
                            offset: const Offset(0, -4),
                          ),
                        ],
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(24),
                          topRight: Radius.circular(24),
                        ),
                      ),
                      child: Column(
                        children: [
                          _buildPriceRow('Items Total', itemsTotal),
                          if (totalDiscount > 0)
                            _buildPriceRow('Discount', -totalDiscount, isDiscount: true),
                          _buildPriceRow('Delivery Charges', deliveryCharges),
                          _buildPriceRow('Tax', taxAmount),
                          Divider(height: 24, thickness: 1, color: Colors.grey[200]),
                          _buildPriceRow('Total', totalAmount, isTotal: true),
                          const SizedBox(height: 20),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green[600],
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 2,
                              ),
                              onPressed: () async {
                                if (cartId == null) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Unable to proceed to checkout. Please try again.'),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                  return;
                                }

                                final result = await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => CheckoutScreen(
                                      pharmacyId: widget.pharmacyId,
                                      cart: _cart,
                                    ),
                                  ),
                                );
                                if (result == true) {
                                  if (!mounted) return;
                                  await _loadCart(showError: false);
                                  if (!mounted) return;
                                  Navigator.pop(context, true);
                                }
                              },
                              child: const Text(
                                'Proceed to Checkout',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildPriceRow(String label, double amount, {bool isDiscount = false, bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 18 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isDiscount ? Colors.green : Colors.black87,
            ),
          ),
          Text(
            '${isDiscount ? '-' : ''}₹${amount.toStringAsFixed(2)}',
            style: TextStyle(
              fontSize: isTotal ? 20 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isTotal ? Colors.green[700] : (isDiscount ? Colors.green : Colors.black87),
            ),
          ),
        ],
      ),
    );
  }
}

