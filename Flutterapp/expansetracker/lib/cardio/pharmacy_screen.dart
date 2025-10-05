import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:icons_plus/icons_plus.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class PharmacyScreen extends StatefulWidget {
  const PharmacyScreen({Key? key}) : super(key: key);

  @override
  _PharmacyScreenState createState() => _PharmacyScreenState();
}

class _PharmacyScreenState extends State<PharmacyScreen> {
  int _selectedIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  List<Map<String, dynamic>> cartItems = [];

  final List<Widget> _screens = [
    PharmacyHomeScreen(),
    MedicineListScreen(),
    Container(), // Placeholder for cart, will be built separately
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: const Text('Pharmacy'),
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
      ),
      drawer: _buildDrawer(),
      body: _selectedIndex == 2 ? _buildCartScreen() : _screens[_selectedIndex],
      floatingActionButton: _selectedIndex != 2
          ? FloatingActionButton(
        onPressed: () {
          setState(() {
            _selectedIndex = 2;
          });
        },
        child: Badge(
          label: Text(cartItems.length.toString()),
          child: const Icon(Icons.shopping_cart),
        ),
      )
          : null,
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(
              color: Colors.blue,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                CircleAvatar(
                  radius: 30,
                  child: Icon(Icons.person, size: 40),
                ),
                SizedBox(height: 10),
                Text(
                  'Welcome to Pharmacy',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.home),
            title: const Text('General'),
            selected: _selectedIndex == 0,
            onTap: () {
              setState(() {
                _selectedIndex = 0;
              });
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.medication),
            title: const Text('Medicines'),
            selected: _selectedIndex == 1,
            onTap: () {
              setState(() {
                _selectedIndex = 1;
              });
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.shopping_cart),
            title: const Text('Cart'),
            trailing: cartItems.isNotEmpty
                ? CircleAvatar(
              radius: 12,
              backgroundColor: Colors.red,
              child: Text(
                cartItems.length.toString(),
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            )
                : null,
            selected: _selectedIndex == 2,
            onTap: () {
              setState(() {
                _selectedIndex = 2;
              });
              Navigator.pop(context);
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.upload_file),
            title: const Text('Upload Prescription'),
            onTap: () {
              Navigator.pop(context);
              _showUploadPrescriptionDialog();
            },
          ),
          ListTile(
            leading: const Icon(Icons.history),
            title: const Text('Order History'),
            onTap: () {
              Navigator.pop(context);
              // Navigate to order history
            },
          ),
          ListTile(
            leading: const Icon(Icons.favorite),
            title: const Text('Favorites'),
            onTap: () {
              Navigator.pop(context);
              // Navigate to favorites
            },
          ),
          ListTile(
            leading: const Icon(Icons.notifications),
            title: const Text('Refill Reminders'),
            onTap: () {
              Navigator.pop(context);
              // Navigate to refill reminders
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCartScreen() {
    double subtotal = cartItems.fold(
        0, (sum, item) => sum + (item['price'] as double) * (item['quantity'] as int));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your Cart'),
      ),
      body: Column(
        children: [
          Expanded(
            child: cartItems.isEmpty
                ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shopping_cart_outlined, size: 60, color: Colors.grey),
                  SizedBox(height: 10),
                  Text('Your cart is empty'),
                ],
              ),
            )
                : ListView.builder(
              itemCount: cartItems.length,
              itemBuilder: (context, index) {
                final item = cartItems[index];
                return Dismissible(
                  key: Key(item['id'].toString()),
                  background: Container(
                    color: Colors.red,
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    child: const Icon(Icons.delete, color: Colors.white),
                  ),
                  direction: DismissDirection.endToStart,
                  onDismissed: (direction) {
                    setState(() {
                      cartItems.removeAt(index);
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('${item['name']} removed')),
                    );
                  },
                  child: Card(
                    margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              color: Colors.grey[200],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.medication,
                                color: Colors.blue, size: 30),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item['name'],
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                Text('\$${item['price'].toStringAsFixed(2)}',
                                    style: const TextStyle(color: Colors.green)),
                                const SizedBox(height: 5),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove, size: 18),
                                      onPressed: () {
                                        setState(() {
                                          if (item['quantity'] > 1) {
                                            item['quantity']--;
                                          } else {
                                            cartItems.removeAt(index);
                                          }
                                        });
                                      },
                                    ),
                                    Text(item['quantity'].toString(),
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold)),
                                    IconButton(
                                      icon: const Icon(Icons.add, size: 18),
                                      onPressed: () {
                                        setState(() {
                                          item['quantity']++;
                                        });
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          if (cartItems.isNotEmpty) _buildCheckoutSection(subtotal),
        ],
      ),
    );
  }

  Widget _buildCheckoutSection(double subtotal) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.2),
            spreadRadius: 2,
            blurRadius: 5,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Subtotal', style: TextStyle(color: Colors.grey)),
              Text('\$${subtotal.toStringAsFixed(2)}',
                  style: const TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 5),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text('Delivery', style: TextStyle(color: Colors.grey)),
              Text('\$2.99', style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 5),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('\$${(subtotal + 2.99).toStringAsFixed(2)}',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: Colors.green)),
            ],
          ),
          const SizedBox(height: 15),
          TextField(
            decoration: InputDecoration(
              hintText: 'Enter coupon code',
              suffixIcon: TextButton(
                onPressed: () {},
                child: const Text('Apply'),
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 15),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              onPressed: () {
                // Proceed to checkout
              },
              child: const Text('Proceed to Checkout'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showUploadPrescriptionDialog() async {
    File? selectedImage;
    final picker = ImagePicker();

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text('Upload Prescription'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (selectedImage != null)
                      Container(
                        height: 200,
                        decoration: BoxDecoration(
                          image: DecorationImage(
                            image: FileImage(selectedImage!),
                            fit: BoxFit.contain,
                          ),
                        ),
                      )
                    else
                      Container(
                        height: 200,
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.upload_file, size: 50, color: Colors.grey),
                              SizedBox(height: 10),
                              Text('No image selected'),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        ElevatedButton(
                          onPressed: () async {
                            final pickedFile = await picker.pickImage(
                                source: ImageSource.camera);
                            if (pickedFile != null) {
                              setState(() {
                                selectedImage = File(pickedFile.path);
                              });
                            }
                          },
                          child: const Text('Camera'),
                        ),
                        ElevatedButton(
                          onPressed: () async {
                            final pickedFile = await picker.pickImage(
                                source: ImageSource.gallery);
                            if (pickedFile != null) {
                              setState(() {
                                selectedImage = File(pickedFile.path);
                              });
                            }
                          },
                          child: const Text('Gallery'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    const TextField(
                      decoration: InputDecoration(
                        labelText: 'Doctor Name (Optional)',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    const TextField(
                      decoration: InputDecoration(
                        labelText: 'Additional Notes (Optional)',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 3,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: selectedImage != null
                      ? () {
                    // Handle prescription upload
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text('Prescription uploaded successfully')),
                    );
                  }
                      : null,
                  child: const Text('Upload'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _addToCart(Map<String, dynamic> medicine) {
    setState(() {
      final existingItemIndex =
      cartItems.indexWhere((item) => item['id'] == medicine['id']);
      if (existingItemIndex >= 0) {
        cartItems[existingItemIndex]['quantity']++;
      } else {
        cartItems.add({
          'id': medicine['id'],
          'name': medicine['name'],
          'price': medicine['price'],
          'quantity': 1,
        });
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${medicine['name']} added to cart')),
    );
  }
}

class PharmacyHomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSearchBar(),
          const SizedBox(height: 20),
          _buildCategoriesSection(),
          const SizedBox(height: 20),
          _buildQuickLinksSection(context),
          const SizedBox(height: 20),
          _buildFeaturedMedicines(),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.2),
            spreadRadius: 2,
            blurRadius: 5,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: TextField(
        decoration: InputDecoration(
          hintText: 'Search medicines...',
          prefixIcon: const Icon(Icons.search, color: Colors.grey),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 15),
        ),
      ),
    );
  }

  Widget _buildCategoriesSection() {
    final categories = [
     {'icon': FontAwesome.heart_pulse, 'name': 'Heart Care'},
      {'icon': FontAwesome.pills, 'name': 'Supplements'},
      {'icon': FontAwesome.virus, 'name': 'Fever & Cold'},
      {'icon': FontAwesome.bandage, 'name': 'First Aid'},
      {'icon': FontAwesome.baby, 'name': 'Baby Care'},
      {'icon': FontAwesome.eye, 'name': 'Eye Care'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Categories',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: categories.length,
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.only(right: 15),
                child: Column(
                  children: [
                    Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        color: Colors.blue[50],
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: Icon(
                        categories[index]['icon'] as IconData,
                        color: Colors.blue[800],
                        size: 30,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      categories[index]['name'] as String,
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildQuickLinksSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Links',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildQuickLinkCard(
              icon: Icons.upload_file,
              title: 'Upload Prescription',
              color: Colors.purple[50]!,
              iconColor: Colors.purple,
              onTap: () {
                (context as Element).findAncestorStateOfType<_PharmacyScreenState>()?._showUploadPrescriptionDialog();
              },
            ),
            _buildQuickLinkCard(
              icon: Icons.shopping_bag,
              title: 'My Orders',
              color: Colors.green[50]!,
              iconColor: Colors.green,
              onTap: () {
                // Navigate to orders
              },
            ),
            _buildQuickLinkCard(
              icon: Icons.notifications,
              title: 'Refill Reminder',
              color: Colors.orange[50]!,
              iconColor: Colors.orange,
              onTap: () {
                // Navigate to reminders
              },
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickLinkCard({
    required IconData icon,
    required String title,
    required Color color,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(right: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(
            children: [
              Icon(icon, color: iconColor, size: 30),
              const SizedBox(height: 5),
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[800],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeaturedMedicines() {
    final medicines = [
      {
        'id': 1,
        'name': 'Atenolol 50mg',
        'description': 'For high blood pressure',
        'price': 12.99,
        'requiresPrescription': true,
      },
      {
        'id': 2,
        'name': 'Vitamin D3',
        'description': 'Bone health supplement',
        'price': 8.49,
        'requiresPrescription': false,
      },
      {
        'id': 3,
        'name': 'Ibuprofen 200mg',
        'description': 'Pain reliever',
        'price': 5.99,
        'requiresPrescription': false,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Featured Medicines',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: medicines.length,
          itemBuilder: (context, index) {
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.medication,
                          color: Colors.blue, size: 30),
                    ),
                    const SizedBox(width: 15),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            medicines[index]['name'] as String,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          Text(
                            medicines[index]['description'] as String,
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                          const SizedBox(height: 5),
                          Row(
                            children: [
                              Text(
                                '\$${medicines[index]['price'].toString()}',
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green),
                              ),
                              const Spacer(),
                              if (medicines[index]['requiresPrescription'] as bool)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.red[50],
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Text(
                                    'Rx Required',
                                    style: TextStyle(
                                        fontSize: 10, color: Colors.red),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add_shopping_cart, color: Colors.blue),
                      onPressed: () {
                        (context as Element).findAncestorStateOfType<_PharmacyScreenState>()?._addToCart(medicines[index]);
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

class MedicineListScreen extends StatelessWidget {
  final List<Map<String, dynamic>> medicines = [
    {
      'id': 1,
      'name': 'Atenolol 50mg',
      'description': 'For high blood pressure',
      'price': 12.99,
      'requiresPrescription': true,
      'category': 'Heart Care',
    },
    {
      'id': 2,
      'name': 'Vitamin D3',
      'description': 'Bone health supplement',
      'price': 8.49,
      'requiresPrescription': false,
      'category': 'Supplements',
    },
    {
      'id': 3,
      'name': 'Ibuprofen 200mg',
      'description': 'Pain reliever',
      'price': 5.99,
      'requiresPrescription': false,
      'category': 'Pain Relief',
    },
    {
      'id': 4,
      'name': 'Amoxicillin 500mg',
      'description': 'Antibiotic',
      'price': 15.99,
      'requiresPrescription': true,
      'category': 'Antibiotics',
    },
    {
      'id': 5,
      'name': 'Cetirizine 10mg',
      'description': 'Antihistamine',
      'price': 4.99,
      'requiresPrescription': false,
      'category': 'Allergy',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Medicines'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                builder: (context) => _buildFilters(),
              );
            },
          ),
        ],
      ),
      body: ListView.builder(
        itemCount: medicines.length,
        itemBuilder: (context, index) => _buildMedicineItem(context, medicines[index]),
      ),
    );
  }

  Widget _buildMedicineItem(BuildContext context, Map<String, dynamic> medicine) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.medication, color: Colors.blue, size: 30),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    medicine['name'],
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Text(medicine['description'],
                      style: TextStyle(color: Colors.grey[600])),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      Text(
                        '\$${medicine['price'].toString()}',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, color: Colors.green),
                      ),
                      const Spacer(),
                      if (medicine['requiresPrescription'] as bool)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.red[50],
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Text(
                            'Rx Required',
                            style: TextStyle(fontSize: 10, color: Colors.red),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.add_shopping_cart, color: Colors.blue),
              onPressed: () {
                (context as Element).findAncestorStateOfType<_PharmacyScreenState>()?._addToCart(medicine);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Filters',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),
          const Text('Condition',
              style: TextStyle(fontWeight: FontWeight.bold)),
          Wrap(
            spacing: 8,
            children: [
              FilterChip(
                label: const Text('Hypertension'),
                onSelected: (bool value) {},
                selected: false,
              ),
              FilterChip(
                label: const Text('Heart Failure'),
                onSelected: (bool value) {},
                selected: false,
              ),
              FilterChip(
                label: const Text('Diabetes'),
                onSelected: (bool value) {},
                selected: false,
              ),
            ],
          ),
          const SizedBox(height: 15),
          const Text('Type', style: TextStyle(fontWeight: FontWeight.bold)),
          Wrap(
            spacing: 8,
            children: [
              FilterChip(
                label: const Text('Brand'),
                onSelected: (bool value) {},
                selected: false,
              ),
              FilterChip(
                label: const Text('Generic'),
                onSelected: (bool value) {},
                selected: true,
              ),
            ],
          ),
          const SizedBox(height: 15),
          const Text('Availability',
              style: TextStyle(fontWeight: FontWeight.bold)),
          SwitchListTile(
            title: const Text('In stock only'),
            value: true,
            onChanged: (bool value) {},
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
              //  Navigator.pop(context);
              },
              child: const Text('Apply Filters'),
            ),
          ),
        ],
      ),
    );
  }
}