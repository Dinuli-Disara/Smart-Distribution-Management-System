// frontend-mobile/src/screens/salesrep/Dashboard.tsx (COMPLETE FIXED VERSION)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  ShoppingCart,
  Users,
  MapPin,
  Package,
  Bell,
  FileText,
  UserPlus,
  RotateCcw,
  Plus,
  Trash2,
  Home,
  User,
  TrendingUp,
  CheckCircle2,
  Clock,
  X,
  Truck,
  ChevronRight,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  Edit2,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import productService, { VanStock } from '../../services/productService';
import orderService, { PreOrder } from '../../services/orderService';
import profileService, { EmployeeProfile, UpdateEmployeeData } from '../../services/profileService';
import "../../assets/logo.png";
import api from '../../services/api';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SalesDashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

interface OrderProduct {
  id: string;
  product_id: number;
  product: string;
  qty: number;
  price: number;
}

interface Customer {
  customer_id: number;
  name: string;
  shop_name: string;
  address: string;
  contact: string;
}


const Dashboard: React.FC<Props> = ({ navigation }) => {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editProfileData, setEditProfileData] = useState({ name: '', username: '', contact: '' });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Data states
  const [vanStock, setVanStock] = useState<VanStock[]>([]);
  const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Mock data for today's visits (temporary until API is ready)
  const [todayVisits, setTodayVisits] = useState([
    { id: '1', customer: 'ABC Retail', address: '123 Main St', status: 'Pending', time: '10:00 AM', amount: 0 },
    { id: '2', customer: 'XYZ Store', address: '456 Oak Ave', status: 'Pending', time: '2:00 PM', amount: 0 },
  ]);

  const todayStats = {
    completed: todayVisits.filter(v => v.status === 'Completed').length,
    pending: todayVisits.filter(v => v.status === 'Pending').length,
    totalSales: todayVisits.reduce((sum, v) => sum + v.amount, 0),
  };

  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    shop_name: '',
    email: '',
    contact: '',
    address: '',
    username: '',
    password: '',
    confirmPassword: '',
    route_id: '', // Add route selection
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [deliveryRoutes, setDeliveryRoutes] = useState<Array<{ route_id: number, route_name: string, area_name?: string }>>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Load profile data
  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const profileData = await profileService.getEmployeeProfile();
      setProfile(profileData);
      // Only set editable fields (name, username, contact) - NO EMAIL
      setEditProfileData({
        name: profileData.name,
        username: profileData.username,
        contact: profileData.contact || '',
      });
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Load van stock
  const loadVanStock = async () => {
    try {
      const stock = await productService.getVanStock();
      setVanStock(stock);
    } catch (error) {
      console.error('Load van stock error:', error);
    }
  };

  // Load pre-orders
  const loadPreOrders = async () => {
    try {
      const orders = await orderService.getSalesRepPreOrders();
      setPreOrders(orders);
    } catch (error) {
      console.error('Load pre-orders error:', error);
    }
  };

  // Load customers
  const loadCustomers = async () => {
    try {
      const response: any = await api.get('/customers', { params: { limit: 100 } });
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Load customers error:', error);
    }
  };

  // Load delivery routes for customer assignment
  // Load delivery routes for customer assignment
  const loadDeliveryRoutes = async () => {
    try {
      setLoadingRoutes(true);
      const response: any = await api.get('/delivery-routes');
      console.log('Delivery routes response:', response); // Debug log

      if (response.success && response.data && response.data.length > 0) {
        setDeliveryRoutes(response.data);
      } else {
        console.log('No routes from API, using defaults');
        // Fallback to default routes if API returns empty
        setDeliveryRoutes([
          { route_id: 1, route_name: 'Colombo Central', area_name: 'Colombo' },
          { route_id: 2, route_name: 'Kandy Route', area_name: 'Kandy' },
          { route_id: 3, route_name: 'Galle Route', area_name: 'Galle' },
        ]);
      }
    } catch (error: any) {
      console.error('Load delivery routes error:', error);
      // Set default routes on error so the modal still works
      setDeliveryRoutes([
        { route_id: 1, route_name: 'Colombo Central', area_name: 'Colombo' },
        { route_id: 2, route_name: 'Kandy Route', area_name: 'Kandy' },
        { route_id: 3, route_name: 'Galle Route', area_name: 'Galle' },
      ]);
    } finally {
      setLoadingRoutes(false);
    }
  };

  // Load all data
  const loadAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadVanStock(),
        loadPreOrders(),
        loadCustomers(),
        loadDeliveryRoutes(),
      ]);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadAllData();
  }, []);

  const handleRefresh = async () => {
    await loadAllData();
    await refreshUser();
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // Only send allowed fields for sales rep
      const updateData = {
        name: editProfileData.name,
        username: editProfileData.username,
        contact: editProfileData.contact,
      };

      console.log('Sending update data:', updateData);

      // Pass employee_id as first parameter, data as second
      const updatedProfile = await profileService.updateEmployeeProfile(
        profile.employee_id,
        updateData
      );

      setProfile(updatedProfile);
      setIsEditingProfile(false);
      setSuccessMessage('Profile updated successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await refreshUser();
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await profileService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccessMessage('Password changed successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    setOrderProducts([]);
    setSelectedCustomer(null);
    setActiveForm('order');
  };

  // Function to open the new customer modal
  const handleOpenNewCustomer = () => {
    // Reset form data
    setNewCustomerData({
      name: '',
      shop_name: '',
      email: '',
      contact: '',
      address: '',
      username: '',
      password: '',
      confirmPassword: '',
      route_id: '',
    });
    // Open the modal
    setActiveForm('customer');
  };

  // Function to submit the customer creation
  const handleSubmitCustomer = async () => {
    // Validation
    if (!newCustomerData.name) {
      Alert.alert('Error', 'Please enter customer/contact person name');
      return;
    }

    if (!newCustomerData.shop_name) {
      Alert.alert('Error', 'Please enter shop name');
      return;
    }

    if (!newCustomerData.contact) {
      Alert.alert('Error', 'Please enter contact number');
      return;
    }

    if (!newCustomerData.route_id) {
      Alert.alert('Error', 'Please select a delivery route');
      return;
    }

    if (!newCustomerData.username) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (!newCustomerData.password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (newCustomerData.password !== newCustomerData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newCustomerData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Optional email validation (only if provided)
    if (newCustomerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomerData.email)) {
      Alert.alert('Error', 'Please enter a valid email address or leave empty');
      return;
    }

    setCreatingCustomer(true);
    try {
      const customerPayload = {
        name: newCustomerData.name,
        shop_name: newCustomerData.shop_name,
        email: newCustomerData.email || null,
        contact: newCustomerData.contact,
        address: newCustomerData.address || null,
        username: newCustomerData.username,
        password: newCustomerData.password,
        route_id: parseInt(newCustomerData.route_id),
      };

      console.log('Creating customer with payload:', JSON.stringify(customerPayload, null, 2));

      const response: any = await api.post('/customers', customerPayload);

      console.log('Server response:', response);

      if (response.success) {
        // Reset form
        setNewCustomerData({
          name: '',
          shop_name: '',
          email: '',
          contact: '',
          address: '',
          username: '',
          password: '',
          confirmPassword: '',
          route_id: '',
        });

        // Close modal
        setActiveForm(null);

        // Show success message
        setSuccessMessage('Customer created successfully! They can now log in with their credentials.');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);

        // Refresh customer list
        await loadCustomers();
      } else {
        Alert.alert('Error', response.message || 'Failed to create customer');
      }
    } catch (error: any) {
      console.error('Create customer error:', error);

      // Better error message handling
      let errorMessage = 'Failed to create customer';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleAddOrderProduct = () => {
    setOrderProducts([
      ...orderProducts,
      { id: Date.now().toString(), product_id: 0, product: '', qty: 0, price: 0 },
    ]);
  };

  const handleRemoveOrderProduct = (id: string) => {
    setOrderProducts(orderProducts.filter(item => item.id !== id));
  };

  const handleConfirmOrder = async () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }

    const validProducts = orderProducts.filter(p => p.product_id && p.qty > 0);
    if (validProducts.length === 0) {
      Alert.alert('Error', 'Please add at least one product with quantity');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customer_id: selectedCustomer.customer_id,
        items: validProducts.map(p => ({
          product_id: p.product_id,
          quantity: p.qty,
          price: p.price,
        })),
      };

      await orderService.createOrder(orderData);

      setActiveForm(null);
      setOrderProducts([]);
      setSelectedCustomer(null);
      setSuccessMessage('Order placed successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await loadAllData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: PreOrder['status']) => {
    setLoading(true);
    try {
      await orderService.updatePreOrderStatus(orderId, status);
      await loadPreOrders();
      setSuccessMessage(`Order ${status === 'CONFIRMED' ? 'confirmed' : status === 'DECLINED' ? 'declined' : 'marked as delivered'}!`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout', style: 'destructive', onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  // ==================== HEADER ====================
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>Manjula</Text>
            <Text style={styles.logoSubtitle}>DMS</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.companyName}>Manjula DMS</Text>
            <Text style={styles.roleText}>Sales Representative</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <CheckCircle2 size={16} color="#FFFFFF" />
          <Text style={styles.statLabel}>Completed</Text>
          <Text style={styles.statValue}>
            {todayStats.completed}/{todayVisits.length}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={16} color="#FFFFFF" />
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statValue}>{todayStats.pending}</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={16} color="#FFFFFF" />
          <Text style={styles.statLabel}>Sales</Text>
          <Text style={styles.statValue}>
            Rs {(todayStats.totalSales / 1000).toFixed(0)}K
          </Text>
        </View>
      </View>
    </View>
  );

  // ==================== BOTTOM NAVIGATION ====================
  const renderBottomNav = () => (
    <View style={styles.bottomNav}>
      {[
        { key: 'home', icon: Home, label: 'Home', badge: 0 },
        { key: 'preorders', icon: ShoppingCart, label: 'Orders', badge: preOrders.filter(o => o.status === 'PENDING').length },
        { key: 'stock', icon: Package, label: 'Stock', badge: 0 },
        { key: 'profile', icon: User, label: 'Profile', badge: 0 },
      ].map((item) => (
        <TouchableOpacity
          key={item.key}
          style={[styles.navButton, activeTab === item.key && styles.navButtonActive]}
          onPress={() => setActiveTab(item.key)}
        >
          <item.icon
            size={20}
            color={activeTab === item.key ? '#1E3EA6' : '#6B7280'}
          />
          <Text style={[
            styles.navLabel,
            activeTab === item.key && styles.navLabelActive
          ]}>
            {item.label}
          </Text>
          {item.badge > 0 && (
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>{item.badge}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // ==================== HOME TAB ====================
  const renderHomeTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton} onPress={handlePlaceOrder}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#1E3EA6' }]}>
            <ShoppingCart size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.quickActionText}>Place Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton} onPress={handleOpenNewCustomer}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#DB2777' }]}>
            <UserPlus size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.quickActionText}>New Customer</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Schedule */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MapPin size={20} color="#1E3EA6" />
          <Text style={styles.cardTitle}>Today's Schedule</Text>
        </View>
        <View style={styles.cardContent}>
          {todayVisits.map((visit) => (
            <View key={visit.id} style={styles.visitCard}>
              <View style={styles.visitHeader}>
                <Text style={styles.visitCustomer}>{visit.customer}</Text>
                <View style={[
                  styles.statusBadgeSmall,
                  visit.status === 'Completed' ? styles.statusCompleted : styles.statusPendingSmall
                ]}>
                  <Text style={styles.statusTextSmall}>{visit.status}</Text>
                </View>
              </View>
              <Text style={styles.visitAddress}>{visit.address}</Text>
              <View style={styles.visitFooter}>
                <Text style={styles.visitTime}>{visit.time}</Text>
                {visit.status === 'Completed' ? (
                  <Text style={styles.visitAmount}>Rs {visit.amount.toLocaleString()}</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.orderButton}
                    onPress={() => {
                      const customer = customers.find(c => c.name === visit.customer);
                      if (customer) setSelectedCustomer(customer);
                      setActiveForm('order');
                    }}
                  >
                    <ShoppingCart size={14} color="#FFFFFF" />
                    <Text style={styles.orderButtonText}>Order</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // ==================== NEW CUSTOMER MODAL ====================
  const renderNewCustomerModal = () => (
    <Modal
      visible={activeForm === 'customer'}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setActiveForm(null);
        setNewCustomerData({
          name: '',
          shop_name: '',
          email: '',
          contact: '',
          address: '',
          username: '',
          password: '',
          confirmPassword: '',
          route_id: '',
        });
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Register New Customer</Text>
            <TouchableOpacity onPress={() => setActiveForm(null)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Shop Name - Required */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Shop Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter shop name"
                value={newCustomerData.shop_name}
                onChangeText={(text) => setNewCustomerData({ ...newCustomerData, shop_name: text })}
              />
            </View>

            {/* Owner/Contact Person Name - Required */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Person Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter owner/contact name"
                value={newCustomerData.name}
                onChangeText={(text) => setNewCustomerData({ ...newCustomerData, name: text })}
              />
            </View>

            {/* Contact Number - Required */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="+94 XX XXX XXXX"
                keyboardType="phone-pad"
                value={newCustomerData.contact}
                onChangeText={(text) => setNewCustomerData({ ...newCustomerData, contact: text })}
              />
            </View>

            {/* Email - Optional */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="customer@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newCustomerData.email}
                onChangeText={(text) => setNewCustomerData({ ...newCustomerData, email: text })}
              />
              <Text style={styles.helperText}>Optional - leave empty if no email</Text>
            </View>

            {/* Address - Optional */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Address (Optional)</Text>
              <TextInput
                style={[styles.input, { minHeight: 80 }]}
                placeholder="Enter shop address"
                multiline
                numberOfLines={3}
                value={newCustomerData.address}
                onChangeText={(text) => setNewCustomerData({ ...newCustomerData, address: text })}
              />
            </View>

            {/* Delivery Route - Required */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Delivery Route *</Text>
              {loadingRoutes ? (
                <ActivityIndicator size="small" color="#1E3EA6" />
              ) : (
                <View style={styles.selectContainer}>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => {
                      Alert.alert(
                        'Select Route',
                        deliveryRoutes.map(r => `${r.route_name}${r.area_name ? ` (${r.area_name})` : ''}`).join('\n'),
                        [
                          ...deliveryRoutes.map(route => ({
                            text: `${route.route_name}${route.area_name ? ` (${route.area_name})` : ''}`,
                            onPress: () => setNewCustomerData({ ...newCustomerData, route_id: route.route_id.toString() })
                          })),
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      );
                    }}
                  >
                    <Text style={[
                      styles.selectButtonText,
                      !newCustomerData.route_id && styles.selectButtonPlaceholder
                    ]}>
                      {newCustomerData.route_id
                        ? deliveryRoutes.find(r => r.route_id === parseInt(newCustomerData.route_id))?.route_name || 'Select route'
                        : 'Select delivery route'}
                    </Text>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.helperText}>Select the delivery route for this customer</Text>
            </View>

            <View style={styles.dividerLine} />

            {/* Login Credentials Section */}
            <Text style={styles.sectionTitle}>Login Credentials</Text>

            {/* Username - Required */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Username *</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                autoCapitalize="none"
                value={newCustomerData.username}
                onChangeText={(text) => setNewCustomerData({ ...newCustomerData, username: text })}
              />
              <Text style={styles.helperText}>Must be unique</Text>
            </View>

            {/* Password - Required */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a password (min 6 characters)"
                secureTextEntry
                value={newCustomerData.password}
                onChangeText={(text) => setNewCustomerData({ ...newCustomerData, password: text })}
              />
            </View>

            {/* Confirm Password - Required */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                secureTextEntry
                value={newCustomerData.confirmPassword}
                onChangeText={(text) => setNewCustomerData({ ...newCustomerData, confirmPassword: text })}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.confirmButton, { flex: 1 }]}
                onPress={handleSubmitCustomer}
                disabled={creatingCustomer}
              >
                {creatingCustomer ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Register Customer</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1 }]}
                onPress={() => {
                  setActiveForm(null);
                  setNewCustomerData({
                    name: '',
                    shop_name: '',
                    email: '',
                    contact: '',
                    address: '',
                    username: '',
                    password: '',
                    confirmPassword: '',
                    route_id: '',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ==================== PROFILE TAB (CORRECTED) ====================
  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <User size={20} color="#1E3EA6" />
          <Text style={styles.cardTitle}>Profile</Text>
        </View>
        <View style={styles.cardContent}>
          {profileLoading ? (
            <ActivityIndicator size="large" color="#1E3EA6" />
          ) : isEditingProfile ? (
            <>
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarText}>
                  {profile?.name?.charAt(0).toUpperCase() || 'SR'}
                </Text>
              </View>

              {/* Name - Editable */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editProfileData.name}
                  onChangeText={(text) => setEditProfileData({ ...editProfileData, name: text })}
                  placeholder="Enter your name"
                />
              </View>

              {/* Username - Editable */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Username *</Text>
                <TextInput
                  style={styles.input}
                  value={editProfileData.username}
                  onChangeText={(text) => setEditProfileData({ ...editProfileData, username: text })}
                  autoCapitalize="none"
                  placeholder="Enter username"
                />
              </View>

              {/* Contact - Editable */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Contact Number</Text>
                <TextInput
                  style={styles.input}
                  value={editProfileData.contact}
                  onChangeText={(text) => setEditProfileData({ ...editProfileData, contact: text })}
                  keyboardType="phone-pad"
                  placeholder="Enter phone number"
                />
              </View>

              {/* Email - READ ONLY (cannot be edited by sales rep) */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email (Read-only)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: '#F3F4F6', color: '#6B7280' }]}
                  value={profile?.email}
                  editable={false}
                />
                <Text style={styles.helperText}>Contact admin to change email</Text>
              </View>

              {/* Role - READ ONLY */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Role (Read-only)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: '#F3F4F6', color: '#6B7280' }]}
                  value={profile?.role}
                  editable={false}
                />
              </View>

              {/* Area - READ ONLY */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Area (Read-only)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: '#F3F4F6', color: '#6B7280' }]}
                  value={profile?.area_name || 'Not assigned'}
                  editable={false}
                />
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: '#10B981' }]}
                  onPress={handleUpdateProfile}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.editButtonText}>Save Changes</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: '#6B7280' }]}
                  onPress={() => {
                    setIsEditingProfile(false);
                    setEditProfileData({
                      name: profile?.name || '',
                      username: profile?.username || '',
                      contact: profile?.contact || '',
                    });
                  }}
                >
                  <Text style={styles.editButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // View mode - show all fields
            <>
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarText}>
                  {profile?.name?.charAt(0).toUpperCase() || 'SR'}
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput style={styles.input} value={profile?.name} editable={false} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role</Text>
                <TextInput style={styles.input} value={profile?.role} editable={false} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Area</Text>
                <TextInput style={styles.input} value={profile?.area_name || 'Not assigned'} editable={false} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput style={styles.input} value={profile?.contact || 'Not provided'} editable={false} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={profile?.email} editable={false} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput style={styles.input} value={profile?.username} editable={false} />
              </View>

              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditingProfile(true)}>
                <Edit2 size={16} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.changePasswordButton} onPress={() => setShowChangePassword(true)}>
                <Text style={styles.changePasswordText}>Change Password</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Change Password Modal */}
      <Modal visible={showChangePassword} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowChangePassword(false)}><X size={24} color="#6B7280" /></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput style={styles.input} secureTextEntry value={passwordData.currentPassword} onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput style={styles.input} secureTextEntry value={passwordData.newPassword} onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput style={styles.input} secureTextEntry value={passwordData.confirmPassword} onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })} />
              </View>
              <TouchableOpacity style={styles.confirmButton} onPress={handleChangePassword} disabled={passwordLoading}>
                {passwordLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.confirmButtonText}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );

  // ==================== PRE-ORDERS TAB ====================
  const renderPreOrdersTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <ShoppingCart size={20} color="#1E3EA6" />
          <Text style={styles.cardTitle}>Customer Pre-Orders</Text>
        </View>
        <View style={styles.cardContent}>
          {preOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <ShoppingCart size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No pre-orders yet</Text>
            </View>
          ) : (
            preOrders.map((order) => {
              const getStatusColor = () => {
                switch (order.status) {
                  case 'PENDING': return { bg: '#FEF3C7', text: '#92400E', border: '#FBBF24' };
                  case 'CONFIRMED': return { bg: '#DBEAFE', text: '#1E40AF', border: '#60A5FA' };
                  case 'DECLINED': return { bg: '#FEE2E2', text: '#991B1B', border: '#F87171' };
                  default: return { bg: '#FEF3C7', text: '#92400E', border: '#FBBF24' };
                }
              };
              const statusColor = getStatusColor();

              return (
                <View key={order.pre_order_id} style={styles.preOrderCard}>
                  <View style={styles.preOrderHeader}>
                    <View>
                      <Text style={styles.preOrderCustomer}>{order.customer_name}</Text>
                      <Text style={styles.preOrderId}>{order.pre_order_number}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor.bg, borderColor: statusColor.border }]}>
                      <Text style={[styles.statusText, { color: statusColor.text }]}>{order.status}</Text>
                    </View>
                  </View>
                  <View style={styles.productsList}>
                    {order.items?.slice(0, 2).map((product, idx) => (
                      <View key={idx} style={styles.productItem}>
                        <Text style={styles.productName}>{product.product_name} x {product.quantity}</Text>
                        <Text style={styles.productPrice}>Rs {(product.price * product.quantity).toLocaleString()}</Text>
                      </View>
                    ))}
                    <View style={styles.divider} />
                    <View style={styles.totalItem}>
                      <Text style={{ fontWeight: '600' }}>Total</Text>
                      <Text style={{ color: '#1E3EA6', fontWeight: '600' }}>Rs {order.net_amount?.toLocaleString()}</Text>
                    </View>
                  </View>
                  {order.status === 'PENDING' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10B981' }]} onPress={() => handleUpdateOrderStatus(order.pre_order_id, 'CONFIRMED')}>
                        <CheckCircle2 size={16} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, styles.declineButton]} onPress={() => handleUpdateOrderStatus(order.pre_order_id, 'DECLINED')}>
                        <X size={16} color="#DC2626" />
                        <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );

  // ==================== STOCK TAB ====================
  const renderStockTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Package size={20} color="#1E3EA6" />
          <Text style={styles.cardTitle}>Van Stock</Text>
        </View>
        <View style={styles.cardContent}>
          {vanStock.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No stock available</Text>
            </View>
          ) : (
            vanStock.map((item) => (
              <View key={item.van_stock_id} style={styles.stockItem}>
                <View style={styles.stockInfo}>
                  <Text style={styles.stockProduct}>{item.product_name}</Text>
                  <Text style={styles.stockPrice}>Rs {item.unit_price}</Text>
                </View>
                <View style={[styles.stockBadge, item.available_quantity > 30 ? styles.stockGood : styles.stockLow]}>
                  <Text style={styles.stockBadgeText}>{item.available_quantity} units</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );

  // ==================== ORDER MODAL ====================
  const renderOrderModal = () => (
    <Modal
      visible={activeForm === 'order'}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setActiveForm(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '90%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Place Order</Text>
            <TouchableOpacity onPress={() => setActiveForm(null)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Customer Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Customer *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  Alert.alert(
                    'Select Customer',
                    customers.map(c => `${c.name} - ${c.shop_name}`).join('\n'),
                    [
                      ...customers.map(customer => ({
                        text: `${customer.name} - ${customer.shop_name}`,
                        onPress: () => setSelectedCustomer(customer)
                      })),
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
              >
                <Text style={selectedCustomer ? styles.selectButtonText : styles.selectButtonPlaceholder}>
                  {selectedCustomer ? `${selectedCustomer.name} - ${selectedCustomer.shop_name}` : 'Choose a customer'}
                </Text>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Products Section */}
            <Text style={styles.sectionTitle}>Products</Text>

            {orderProducts.map((item, index) => (
              <View key={item.id} style={styles.orderProductCard}>
                <View style={styles.orderProductHeader}>
                  <Text style={styles.orderProductTitle}>Product {index + 1}</Text>
                  <TouchableOpacity onPress={() => handleRemoveOrderProduct(item.id)}>
                    <Trash2 size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>

                {/* Product Selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Product</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => {
                      Alert.alert(
                        'Select Product',
                        vanStock.map(p => `${p.product_name} - Rs ${p.unit_price}`).join('\n'),
                        [
                          ...vanStock.map(product => ({
                            text: `${product.product_name} - Rs ${product.unit_price}`,
                            onPress: () => {
                              const updatedProducts = [...orderProducts];
                              updatedProducts[index] = {
                                ...updatedProducts[index],
                                product_id: product.product_id,
                                product: product.product_name,
                                price: product.unit_price
                              };
                              setOrderProducts(updatedProducts);
                            }
                          })),
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      );
                    }}
                  >
                    <Text style={item.product ? styles.selectButtonText : styles.selectButtonPlaceholder}>
                      {item.product || 'Select a product'}
                    </Text>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Quantity */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter quantity"
                    keyboardType="numeric"
                    value={item.qty.toString()}
                    onChangeText={(text) => {
                      const qty = parseInt(text) || 0;
                      const updatedProducts = [...orderProducts];
                      updatedProducts[index] = { ...updatedProducts[index], qty };
                      setOrderProducts(updatedProducts);
                    }}
                  />
                </View>

                {/* Price Display */}
                {item.price > 0 && item.qty > 0 && (
                  <View style={styles.orderProductTotal}>
                    <Text style={styles.label}>Subtotal:</Text>
                    <Text style={styles.orderTotalAmount}>Rs {(item.price * item.qty).toLocaleString()}</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Add Product Button */}
            <TouchableOpacity
              style={styles.addProductButton}
              onPress={handleAddOrderProduct}
            >
              <Plus size={20} color="#1E3EA6" />
              <Text style={styles.addProductButtonText}>Add Product</Text>
            </TouchableOpacity>

            {/* Order Summary */}
            {orderProducts.length > 0 && (
              <View style={styles.orderSummary}>
                <Text style={styles.orderSummaryTitle}>Order Summary</Text>
                <View style={styles.orderSummaryRow}>
                  <Text>Subtotal:</Text>
                  <Text>Rs {orderProducts.reduce((sum, p) => sum + (p.price * p.qty), 0).toLocaleString()}</Text>
                </View>
                <View style={styles.orderSummaryRow}>
                  <Text>Discount (Loyalty):</Text>
                  <Text>0%</Text>
                </View>
                <View style={[styles.orderSummaryRow, styles.orderSummaryTotal]}>
                  <Text style={styles.orderSummaryTotalText}>Total:</Text>
                  <Text style={styles.orderSummaryTotalAmount}>
                    Rs {orderProducts.reduce((sum, p) => sum + (p.price * p.qty), 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.confirmButton, { flex: 1 }]}
                onPress={handleConfirmOrder}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Place Order</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1 }]}
                onPress={() => {
                  setActiveForm(null);
                  setOrderProducts([]);
                  setSelectedCustomer(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ==================== MAIN RENDER ====================
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home': return renderHomeTab();
      case 'preorders': return renderPreOrdersTab();
      case 'stock': return renderStockTab();
      case 'profile': return renderProfileTab();
      default: return renderHomeTab();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.mainContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {renderTabContent()}
      </ScrollView>
      {renderBottomNav()}
      {renderNewCustomerModal()}
      {renderOrderModal()}

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successContent}>
            <View style={styles.successIcon}><CheckCircle2 size={40} color="#10B981" /></View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  mainContent: { flex: 1 },
  tabContent: { padding: 16 },

  // Header
  header: { backgroundColor: '#1E3EA6', padding: 16, paddingTop: 8 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoPlaceholder: { alignItems: 'center', marginRight: 12 },
  logoText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  logoSubtitle: { fontSize: 8, color: '#FFFFFF', opacity: 0.8 },
  headerText: { flexDirection: 'column' },
  companyName: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  roleText: { color: '#FFFFFF', opacity: 0.8, fontSize: 14 },
  notificationButton: { padding: 8, position: 'relative' },
  statsContainer: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, alignItems: 'center' },
  statLabel: { color: '#FFFFFF', opacity: 0.8, fontSize: 12, marginTop: 4 },
  statValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 2 },

  // Cards
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginLeft: 8 },
  cardContent: { padding: 16 },

  // Quick Actions
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  quickActionButton: { flex: 1, alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickActionText: { fontSize: 14, fontWeight: '500', color: '#111827' },

  // Visit Card
  visitCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12 },
  visitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  visitCustomer: { fontSize: 16, fontWeight: '600', color: '#111827' },
  visitAddress: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  visitFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  visitTime: { fontSize: 14, color: '#6B7280' },
  visitAmount: { fontSize: 14, color: '#10B981', fontWeight: '600' },
  orderButton: { backgroundColor: '#1E3EA6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4 },
  orderButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '500' },
  statusBadgeSmall: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusCompleted: { backgroundColor: '#D1FAE5' },
  statusPendingSmall: { backgroundColor: '#FEF3C7' },
  statusTextSmall: { fontSize: 12, fontWeight: '500' },

  // Profile
  profileAvatar: { width: 80, height: 80, backgroundColor: '#1E3EA6', borderRadius: 40, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  avatarText: { fontSize: 24, color: '#FFFFFF', fontWeight: '600' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, color: '#111827' },
  editButton: { backgroundColor: '#1E3EA6', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  editButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  changePasswordButton: { borderWidth: 1, borderColor: '#1E3EA6', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 12 },
  changePasswordText: { color: '#1E3EA6', fontSize: 16, fontWeight: '500' },
  logoutButton: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 12 },
  logoutButtonText: { color: '#374151', fontSize: 16, fontWeight: '500' },
  buttonGroup: { flexDirection: 'row', gap: 12, marginTop: 8 },

  // Pre-orders
  preOrderCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 16 },
  preOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  preOrderCustomer: { fontSize: 16, fontWeight: '600', color: '#111827' },
  preOrderId: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '500' },
  productsList: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12 },
  productItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  productName: { fontSize: 14, color: '#374151' },
  productPrice: { fontSize: 14, color: '#6B7280' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  totalItem: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, gap: 8 },
  declineButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DC2626' },
  actionButtonText: { fontSize: 14, fontWeight: '500', color: '#FFFFFF' },

  // Stock
  stockItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12 },
  stockInfo: { flex: 1 },
  stockProduct: { fontSize: 16, fontWeight: '500', color: '#111827', marginBottom: 4 },
  stockPrice: { fontSize: 14, color: '#6B7280' },
  stockBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  stockGood: { backgroundColor: '#D1FAE5' },
  stockLow: { backgroundColor: '#FEF3C7' },
  stockBadgeText: { fontSize: 12, fontWeight: '500' },

  // Bottom Navigation
  bottomNav: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingVertical: 8 },
  navButton: { flex: 1, alignItems: 'center', paddingVertical: 8, position: 'relative' },
  navButtonActive: { backgroundColor: '#EFF6FF' },
  navLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  navLabelActive: { color: '#1E3EA6', fontWeight: '500' },
  navBadge: { position: 'absolute', top: 4, right: 20, backgroundColor: '#DB2777', borderRadius: 10, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  navBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600', paddingHorizontal: 4 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  modalBody: { padding: 20 },
  confirmButton: { backgroundColor: '#1E3EA6', borderRadius: 8, padding: 16, alignItems: 'center' },
  confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  cancelButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 16, alignItems: 'center' },
  cancelButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },

  // Empty State
  emptyState: { alignItems: 'center', padding: 40 },
  emptyStateText: { fontSize: 16, color: '#9CA3AF', marginTop: 12 },

  // Success
  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  successContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', maxWidth: '80%' },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8 },
  successMessage: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  // Add these to your StyleSheet
  selectContainer: {
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  selectButtonPlaceholder: {
    color: '#9CA3AF',
  },

  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },

  // Divider Line
  dividerLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },

  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    marginTop: 8,
  },

  orderProductCard: {
  backgroundColor: '#F9FAFB',
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
},
orderProductHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},
orderProductTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#111827',
},
orderProductTotal: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 12,
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
},
orderTotalAmount: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1E3EA6',
},
addProductButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 12,
  borderWidth: 1,
  borderColor: '#1E3EA6',
  borderRadius: 8,
  borderStyle: 'dashed',
  marginBottom: 20,
  gap: 8,
},
addProductButtonText: {
  color: '#1E3EA6',
  fontSize: 14,
  fontWeight: '500',
},
orderSummary: {
  backgroundColor: '#F3F4F6',
  borderRadius: 12,
  padding: 16,
  marginBottom: 20,
},
orderSummaryTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#111827',
  marginBottom: 12,
},
orderSummaryRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 8,
},
orderSummaryTotal: {
  marginTop: 8,
  paddingTop: 8,
  borderTopWidth: 1,
  borderTopColor: '#D1D5DB',
},
orderSummaryTotalText: {
  fontWeight: '600',
  color: '#111827',
},
orderSummaryTotalAmount: {
  fontWeight: '600',
  color: '#1E3EA6',
  fontSize: 16,
},

});

export default Dashboard;