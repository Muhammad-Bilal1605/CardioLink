import 'package:flutter/material.dart';
import '../../services/inventory_service.dart';
import '../../services/cart_service.dart';
import 'cart_screen.dart';

class PharmacyDetailScreen extends StatefulWidget {
  final String pharmacyId;
  final Map<String, dynamic>? pharmacy;

  const PharmacyDetailScreen({
    Key? key,
    required this.pharmacyId,
    this.pharmacy,
  }) : super(key: key);

  @override
  _PharmacyDetailScreenState createState() => _PharmacyDetailScreenState();
}

class _PharmacyDetailScreenState extends State<PharmacyDetailScreen> {
  List<Map<String, dynamic>> _categories = [];
  Map<String, List<Map<String, dynamic>>> _categoryProducts = {};
  bool _isLoading = true;
  String? _selectedCategoryId;
  int _cartItemCount = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
    _loadCartCount();
  }

  Future<void> _loadCartCount() async {
    final count = await CartService.getCartItemCount(widget.pharmacyId);
    if (!mounted) return;
    setState(() {
      _cartItemCount = count;
    });
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Load inventory for this pharmacy
      final inventoryResult = await InventoryService.getPharmacyInventory(widget.pharmacyId);
      
      print('📦 Inventory result: ${inventoryResult['success']}');
      print('📦 Inventory items count: ${(inventoryResult['data'] ?? []).length}');
      
      if (inventoryResult['success'] == true) {
        final inventoryItems = inventoryResult['data'] ?? [];
        
        if (inventoryItems.isEmpty) {
          print('⚠️ No inventory items found for pharmacy ${widget.pharmacyId}');
          setState(() {
            _isLoading = false;
          });
          return;
        }
        
        // Group products by category
        final Map<String, List<Map<String, dynamic>>> categoryMap = {};
        final Set<String> categoryIds = {};

        for (var item in inventoryItems) {
          final product = item['product'];
          print('🔍 Processing item: ${item['_id']}, product: ${product != null ? product['productName'] ?? product['_id'] : 'null'}');
          
          if (product != null) {
            // Handle category - could be ObjectId string, object with _id, or category name
            String? categoryId;
            String? categoryName;
            
            if (product['category'] != null) {
              if (product['category'] is Map) {
                // Category is populated object
                categoryId = product['category']['_id']?.toString() ?? product['category']['id']?.toString();
                categoryName = product['category']['categoryName'] ?? product['category']['name'];
              } else {
                // Category might be ObjectId string or name string
                final categoryValue = product['category'].toString();
                // Check if it looks like an ObjectId (24 hex characters)
                if (categoryValue.length == 24 && RegExp(r'^[0-9a-fA-F]{24}$').hasMatch(categoryValue)) {
                  categoryId = categoryValue;
                } else {
                  // It's a category name, we'll look it up later
                  categoryName = categoryValue;
                }
              }
            }
            
            if (categoryId != null || categoryName != null) {
              // Use categoryId if available, otherwise use categoryName as key temporarily
              final categoryKey = categoryId ?? categoryName!;
              
              if (categoryId != null) {
                categoryIds.add(categoryId);
              } else if (categoryName != null) {
                // Store category name to look up later
                categoryIds.add(categoryName);
              }
              
              if (!categoryMap.containsKey(categoryKey)) {
                categoryMap[categoryKey] = [];
              }
              
              // Add inventory info to product
              final productMap = Map<String, dynamic>.from(product as Map);
              final productWithInventory = <String, dynamic>{
                ...productMap,
                'inventoryItemId': item['_id'],
                'availableQuantity': item['stockQuantity'] ?? 0,
                'price': item['pricing']?['sellingPrice'] ?? item['pricing']?['mrp'] ?? product['mrp'] ?? 0.0,
                'stockStatus': item['stockStatus'] ?? 'In Stock',
                '_categoryId': categoryId,
                '_categoryName': categoryName,
              };
              
              categoryMap[categoryKey]!.add(productWithInventory);
              print('✅ Added product ${product['productName']} to category ${categoryId ?? categoryName}');
            } else {
              print('⚠️ Product ${product['productName']} has no category');
            }
          } else {
            print('⚠️ Inventory item ${item['_id']} has no product');
          }
        }
        
        print('📊 Categories found: ${categoryIds.length}');
        print('📊 Category map keys: ${categoryMap.keys.toList()}');

        // Categories are enum-based, so we don't need to fetch from API
        // Just create category objects directly from the category names
        if (categoryMap.isNotEmpty) {
          final List<Map<String, dynamic>> validCategories = [];
          
          // Create category objects from the category names (enum values)
          for (var categoryName in categoryMap.keys) {
            final categoryObj = <String, dynamic>{
              '_id': categoryName, // Use name as ID
              'categoryName': categoryName,
              'slug': categoryName.toLowerCase().replaceAll(' ', '-'),
              'isActive': true,
            };
            validCategories.add(categoryObj);
            print('✅ Created category: $categoryName with ${categoryMap[categoryName]!.length} products');
          }

          print('✅ Valid categories: ${validCategories.length}');
          for (var cat in validCategories) {
            final catId = cat['_id']?.toString();
            print('  - ${cat['categoryName']}: ${categoryMap[catId]?.length ?? 0} products');
          }

          print('📦 Final category products map:');
          for (var key in categoryMap.keys) {
            print('  - Key: "$key", Products: ${categoryMap[key]!.length}');
          }
          
          setState(() {
            _categories = validCategories;
            _categoryProducts = categoryMap; // Use categoryMap directly with category names as keys
            _isLoading = false;
          });
          
          print('✅ State updated with ${_categories.length} categories and ${_categoryProducts.length} category groups');
        } else {
          print('⚠️ No categories found');
          setState(() {
            _isLoading = false;
          });
        }
      } else {
        print('❌ Inventory API failed: ${inventoryResult['message']}');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(inventoryResult['message'] ?? 'Failed to load inventory')),
          );
        }
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading pharmacy data: $e');
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading data: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final pharmacy = widget.pharmacy ?? {};
    final address = pharmacy['address'] ?? {};

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.green[700],
        title: Text(
          pharmacy['pharmacyName'] ?? 'Pharmacy',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart_outlined),
                onPressed: () async {
                  final result = await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CartScreen(pharmacyId: widget.pharmacyId),
                    ),
                  );
                  if (result == true) {
                    _loadCartCount();
                  }
                },
              ),
              if (_cartItemCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 18,
                      minHeight: 18,
                    ),
                    child: Text(
                      _cartItemCount > 9 ? '9+' : _cartItemCount.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: Colors.green[700]))
          : _categories.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.inventory_2_outlined, size: 80, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'No products available',
                        style: TextStyle(fontSize: 18, color: Colors.grey[600], fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    // Pharmacy info banner
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.grey.withOpacity(0.1),
                            spreadRadius: 0,
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.green[50],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(Icons.location_on, color: Colors.green[700], size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              '${address['street'] ?? ''}${address['city'] != null ? ', ${address['city']}' : ''}',
                              style: TextStyle(color: Colors.grey[800], fontSize: 14, fontWeight: FontWeight.w500),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Categories horizontal list
                    Container(
                      height: 56,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _categories.length,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemBuilder: (context, index) {
                          final category = _categories[index];
                          final isSelected = _selectedCategoryId == category['_id'].toString();
                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: ChoiceChip(
                              label: Text(
                                category['categoryName'] ?? 'Category',
                                style: TextStyle(
                                  color: isSelected ? Colors.white : Colors.grey[700],
                                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                                  fontSize: 13,
                                ),
                              ),
                              selected: isSelected,
                              onSelected: (selected) {
                                setState(() {
                                  _selectedCategoryId = selected ? category['_id'].toString() : null;
                                });
                              },
                              selectedColor: Colors.green[700],
                              backgroundColor: Colors.white,
                              elevation: isSelected ? 2 : 0,
                              pressElevation: 2,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                                side: BorderSide(
                                  color: isSelected ? Colors.green[700]! : Colors.grey[300]!,
                                  width: 1,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    Divider(height: 1, thickness: 1, color: Colors.grey[200]),
                    // Products list
                    Expanded(
                      child: _buildProductsList(),
                    ),
                  ],
                ),
    );
  }

  Widget _buildProductsList() {
    if (_selectedCategoryId == null) {
      // Show all products grouped by category
      return ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final category = _categories[index];
          final categoryId = category['_id'].toString();
          final products = _categoryProducts[categoryId] ?? [];

          if (products.isEmpty) return const SizedBox.shrink();

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Text(
                  category['categoryName'] ?? 'Category',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.grey[900],
                  ),
                ),
              ),
              ...products.map((product) => _ProductCard(
                    product: product,
                    pharmacyId: widget.pharmacyId,
                    onAddToCart: () {
                      _loadCartCount();
                    },
                  )),
              const SizedBox(height: 8),
            ],
          );
        },
      );
    } else {
      // Show products for selected category
      final products = _categoryProducts[_selectedCategoryId] ?? [];
      if (products.isEmpty) {
        return Center(
          child: Text(
            'No products in this category',
            style: TextStyle(color: Colors.grey[600], fontSize: 16),
          ),
        );
      }

      return ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: products.length,
        itemBuilder: (context, index) {
          return _ProductCard(
            product: products[index],
            pharmacyId: widget.pharmacyId,
            onAddToCart: () {
              _loadCartCount();
            },
          );
        },
      );
    }
  }
}

class _ProductCard extends StatelessWidget {
  final Map<String, dynamic> product;
  final String pharmacyId;
  final VoidCallback onAddToCart;

  const _ProductCard({
    required this.product,
    required this.pharmacyId,
    required this.onAddToCart,
  });

  Future<void> _addToCart(BuildContext context) async {
    try {
      final productId = product['_id'].toString();
      final quantity = 1;
      final availableQuantity = product['availableQuantity'] ?? 0;

      if (availableQuantity < quantity) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Product out of stock')),
          );
        }
        return;
      }

      final result = await CartService.addToCart(
        pharmacyId: pharmacyId,
        productId: productId,
        quantity: quantity,
      );

      if (context.mounted) {
        if (result['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['message'] ?? 'Added to cart')),
          );
          onAddToCart();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['message'] ?? 'Failed to add to cart')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final images = product['images'] ?? {};
    final imageUrl = images['primary'] ?? images['secondary']?[0];
    final price = (product['price'] ?? 0.0).toDouble();
    final mrp = (product['mrp'] ?? price).toDouble();
    final availableQuantity = product['availableQuantity'] ?? 0;
    final stockStatus = product['stockStatus'] ?? 'In Stock';
    final requiresPrescription = product['requiresPrescription'] ?? false;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Row(
          children: [
            // Product image
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
                image: imageUrl != null
                    ? DecorationImage(
                        image: NetworkImage(imageUrl),
                        fit: BoxFit.cover,
                        onError: (_, __) {},
                      )
                    : null,
              ),
              child: imageUrl == null
                  ? Icon(Icons.medication, size: 40, color: Colors.grey[600])
                  : null,
            ),
            const SizedBox(width: 12),
            // Product info
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
                  if (product['brandName'] != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      product['brandName'],
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(
                        '₹${price.toStringAsFixed(2)}',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.green[700],
                        ),
                      ),
                      if (mrp > price) ...[
                        const SizedBox(width: 8),
                        Text(
                          '₹${mrp.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: 12,
                            decoration: TextDecoration.lineThrough,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (requiresPrescription)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.red[50],
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'Rx Required',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.red[700],
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      const Spacer(),
                      Text(
                        stockStatus,
                        style: TextStyle(
                          fontSize: 12,
                          color: stockStatus == 'In Stock' ? Colors.green : Colors.orange,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Add to cart button
            IconButton(
              icon: const Icon(Icons.add_shopping_cart),
              color: availableQuantity > 0 ? Colors.blue : Colors.grey,
              onPressed: availableQuantity > 0 ? () => _addToCart(context) : null,
            ),
          ],
        ),
      ),
    );
  }
}

