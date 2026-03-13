// frontend-mobile/src/screens/salesrep/Dashboard.tsx
import React, { useState, useEffect } from 'react';
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
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import "../../assets/logo.png";

// Define types
type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SalesDashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

interface TodayVisit {
  id: string;
  customer: string;
  address: string;
  status: 'Completed' | 'Pending';
  time: string;
  amount: number;
}

interface VanStockItem {
  id: string;
  product: string;
  available: number;
  price: number;
}

interface PurchaseHistoryItem {
  id: string;
  invoiceNo: string;
  customer: string;
  amount: number;
  status: 'Paid' | 'Partial' | 'Pending';
  remaining?: number;
  date: string;
}

interface OrderProduct {
  id: string;
  product: string;
  qty: number;
  price: number;
}

interface PreOrder {
  id: string;
  customerName: string;
  status: 'pending' | 'confirmed' | 'declined' | 'delivered';
  products: Array<{ product: string; qty: number; price: number }>;
  subtotal?: number;
  discount?: number;
  totalAmount: number;
  timestamp: string;
}

const Dashboard: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Mock data - replace with actual API calls
  const [todayVisits, setTodayVisits] = useState<TodayVisit[]>([
    { id: '1', customer: 'ABC Retail', address: '123 Main St, Colombo', status: 'Completed', time: '09:00 AM', amount: 45000 },
    { id: '2', customer: 'XYZ Store', address: '456 Oak Ave, Kandy', status: 'Pending', time: '11:00 AM', amount: 0 },
    { id: '3', customer: 'Best Shop', address: '789 Pine Rd, Galle', status: 'Pending', time: '02:00 PM', amount: 0 },
    { id: '4', customer: 'Quick Mart', address: '321 Elm St, Colombo', status: 'Pending', time: '04:00 PM', amount: 0 },
  ]);

  const [vanStock, setVanStock] = useState<VanStockItem[]>([
    { id: 'P001', product: 'Product A', available: 45, price: 250 },
    { id: 'P002', product: 'Product B', available: 32, price: 180 },
    { id: 'P003', product: 'Product C', available: 58, price: 320 },
    { id: 'P004', product: 'Product D', available: 29, price: 420 },
  ]);

  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([
    { id: '1', invoiceNo: 'INV-2025-001', customer: 'ABC Retail', amount: 45000, status: 'Paid', date: '2025-10-19' },
    { id: '2', invoiceNo: 'INV-2025-002', customer: 'XYZ Store', amount: 38000, status: 'Partial', remaining: 15000, date: '2025-10-18' },
    { id: '3', invoiceNo: 'INV-2025-003', customer: 'Best Shop', amount: 52000, status: 'Paid', date: '2025-10-17' },
  ]);

  const [preOrders, setPreOrders] = useState<PreOrder[]>([
    {
      id: 'PO-001',
      customerName: 'ABC Retail',
      status: 'pending',
      products: [
        { product: 'Product A', qty: 10, price: 250 },
        { product: 'Product B', qty: 5, price: 180 },
      ],
      subtotal: 3400,
      discount: 10,
      totalAmount: 3060,
      timestamp: '2025-01-28T09:30:00',
    },
  ]);

  const todayStats = {
    completed: todayVisits.filter(v => v.status === 'Completed').length,
    pending: todayVisits.filter(v => v.status === 'Pending').length,
    totalSales: todayVisits.reduce((sum, v) => sum + v.amount, 0),
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Fetch fresh data
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    setRefreshing(false);
  };

  const handlePlaceOrder = () => {
    setActiveForm('order');
  };

  const handleNewCustomer = () => {
    setActiveForm('customer');
  };

  const handleAddOrderProduct = () => {
    setOrderProducts([
      ...orderProducts,
      { id: Date.now().toString(), product: '', qty: 0, price: 0 },
    ]);
  };

  const handleRemoveOrderProduct = (id: string) => {
    setOrderProducts(orderProducts.filter(item => item.id !== id));
  };

  const handleConfirmOrder = () => {
    setActiveForm(null);
    setOrderProducts([]);
    setSelectedCustomer('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    Alert.alert('Success', 'Order placed successfully!');
  };

  const handleConfirmCustomer = () => {
    setActiveForm(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    Alert.alert('Success', 'Customer registered successfully!');
  };

  const handleUpdateOrderStatus = (orderId: string, status: PreOrder['status']) => {
    setPreOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    );
    Alert.alert(
      'Status Updated',
      `Order ${status === 'confirmed' ? 'confirmed' : status === 'declined' ? 'declined' : 'marked as delivered'}!`
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => {
          try {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (error) {
            console.error('Logout error:', error);
          }
        } },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerText}>
            <Text style={styles.companyName}>Manjula DMS</Text>
            <Text style={styles.roleText}>Sales Representative</Text>
          </View>
        </View>
        {/*<TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notifications')}>
          <Bell size={24} color="#FFFFFF" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>*/}
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

  const renderBottomNav = () => (
    <View style={styles.bottomNav}>
      {[
        { key: 'home', icon: Home, label: 'Home' },
        { key: 'preorders', icon: ShoppingCart, label: 'Orders', badge: preOrders.filter(o => o.status === 'pending').length },
        { key: 'stock', icon: Package, label: 'Stock' },
        { key: 'history', icon: FileText, label: 'History' },
        { key: 'profile', icon: User, label: 'Profile' },
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
          {item.badge ? (
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>{item.badge}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ))}
    </View>
  );

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
        <TouchableOpacity style={styles.quickActionButton} onPress={handleNewCustomer}>
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
                  styles.statusBadge,
                  visit.status === 'Completed' ? styles.statusCompleted : styles.statusPending
                ]}>
                  <Text style={styles.statusText}>{visit.status}</Text>
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
                      setSelectedCustomer(visit.customer);
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
                  case 'pending': return { bg: '#FEF3C7', text: '#92400E', border: '#FBBF24' };
                  case 'confirmed': return { bg: '#DBEAFE', text: '#1E40AF', border: '#60A5FA' };
                  case 'declined': return { bg: '#FEE2E2', text: '#991B1B', border: '#F87171' };
                  case 'delivered': return { bg: '#D1FAE5', text: '#065F46', border: '#34D399' };
                  default: return { bg: '#FEF3C7', text: '#92400E', border: '#FBBF24' };
                }
              };
              
              const getStatusIcon = () => {
                switch (order.status) {
                  case 'pending': return Clock;
                  case 'confirmed': return CheckCircle2;
                  case 'declined': return X;
                  case 'delivered': return Truck;
                  default: return Clock;
                }
              };
              
              const StatusIcon = getStatusIcon();
              const statusColor = getStatusColor();

              return (
                <View key={order.id} style={styles.preOrderCard}>
                  <View style={styles.preOrderHeader}>
                    <View>
                      <Text style={styles.preOrderCustomer}>{order.customerName}</Text>
                      <Text style={styles.preOrderId}>{order.id}</Text>
                      <Text style={styles.preOrderDate}>
                        {new Date(order.timestamp).toLocaleDateString()} at{' '}
                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor.bg, borderColor: statusColor.border }]}>
                      <StatusIcon size={12} color={statusColor.text} />
                      <Text style={[styles.statusText, { color: statusColor.text }]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.productsList}>
                    {order.products.map((product, idx) => (
                      <View key={idx} style={styles.productItem}>
                        <Text style={styles.productName}>
                          {product.product} x {product.qty}
                        </Text>
                        <Text style={styles.productPrice}>
                          Rs {(product.price * product.qty).toLocaleString()}
                        </Text>
                      </View>
                    ))}
                    
                    {order.subtotal && order.discount && (
                      <>
                        <View style={styles.divider} />
                        <View style={styles.summaryItem}>
                          <Text>Subtotal</Text>
                          <Text>Rs {order.subtotal.toLocaleString()}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                          <Text style={{ color: '#10B981' }}>
                            Discount ({order.discount}%)
                          </Text>
                          <Text style={{ color: '#10B981' }}>
                            - Rs {(order.subtotal - order.totalAmount).toLocaleString()}
                          </Text>
                        </View>
                      </>
                    )}
                    
                    <View style={styles.divider} />
                    <View style={styles.totalItem}>
                      <Text style={{ fontWeight: '600' }}>Total</Text>
                      <Text style={{ color: '#1E3EA6', fontWeight: '600' }}>
                        Rs {order.totalAmount.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {order.status === 'pending' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                        onPress={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                      >
                        <CheckCircle2 size={16} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.declineButton]}
                        onPress={() => handleUpdateOrderStatus(order.id, 'declined')}
                      >
                        <X size={16} color="#DC2626" />
                        <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {order.status === 'confirmed' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#1E3EA6' }]}
                      onPress={() => handleUpdateOrderStatus(order.id, 'delivered')}
                    >
                      <Truck size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Mark as Delivered</Text>
                    </TouchableOpacity>
                  )}

                  {(order.status === 'delivered' || order.status === 'declined') && (
                    <View style={[styles.statusMessage, { backgroundColor: statusColor.bg }]}>
                      <StatusIcon size={16} color={statusColor.text} />
                      <Text style={[styles.statusMessageText, { color: statusColor.text }]}>
                        {order.status === 'delivered' ? 'Delivered' : 'Declined'}
                      </Text>
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

  const renderStockTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Package size={20} color="#1E3EA6" />
          <Text style={styles.cardTitle}>Van Stock</Text>
        </View>
        <View style={styles.cardContent}>
          {vanStock.map((item) => (
            <View key={item.id} style={styles.stockItem}>
              <View style={styles.stockInfo}>
                <Text style={styles.stockProduct}>{item.product}</Text>
                <Text style={styles.stockPrice}>Rs {item.price}</Text>
              </View>
              <View style={[
                styles.stockBadge,
                item.available > 30 ? styles.stockGood : styles.stockLow
              ]}>
                <Text style={styles.stockBadgeText}>{item.available} units</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FileText size={20} color="#1E3EA6" />
          <Text style={styles.cardTitle}>Purchase History</Text>
        </View>
        <View style={styles.cardContent}>
          {purchaseHistory.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Text style={styles.invoiceNo}>{item.invoiceNo}</Text>
                <View style={[
                  styles.statusBadge,
                  item.status === 'Paid' ? styles.statusPaid : 
                  item.status === 'Partial' ? styles.statusPartial : styles.statusPending
                ]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.customerName}>{item.customer}</Text>
              <View style={styles.historyFooter}>
                <Text style={styles.historyDate}>{item.date}</Text>
                <View style={styles.historyAmount}>
                  <Text style={styles.amountText}>Rs {item.amount.toLocaleString()}</Text>
                  {item.status === 'Partial' && item.remaining && (
                    <Text style={styles.dueText}>Due: Rs {item.remaining.toLocaleString()}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <User size={20} color="#1E3EA6" />
          <Text style={styles.cardTitle}>Profile</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarText}>SR</Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value="Kasun Perera"
              editable={false}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Role</Text>
            <TextInput
              style={styles.input}
              value="Sales Representative"
              editable={false}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Van Number</Text>
            <TextInput
              style={styles.input}
              value="VAN-003"
              editable={false}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Route</Text>
            <TextInput
              style={styles.input}
              value="Area 1 - Colombo Central"
              editable={false}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value="+94 77 123 4567"
              editable={false}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value="kasun@manjula.lk"
              editable={false}
            />
          </View>
          
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderOrderModal = () => (
    <Modal
      visible={activeForm === 'order'}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setActiveForm(null);
        setOrderProducts([]);
        setSelectedCustomer('');
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Place Customer Order</Text>
            <TouchableOpacity onPress={() => setActiveForm(null)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Customer</Text>
              <View style={styles.selectContainer}>
                <Text style={styles.selectValue}>
                  {selectedCustomer || 'Select customer'}
                </Text>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>
            </View>

            {orderProducts.map((item, index) => (
              <View key={item.id} style={styles.orderProductCard}>
                <View style={styles.productHeader}>
                  <Text style={styles.productLabel}>Product {index + 1}</Text>
                  <TouchableOpacity onPress={() => handleRemoveOrderProduct(item.id)}>
                    <Trash2 size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Product</Text>
                  <View style={styles.selectContainer}>
                    <Text style={styles.selectValue}>Select product</Text>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter quantity"
                    keyboardType="numeric"
                    value={item.qty.toString()}
                    onChangeText={(value) => {
                      const updated = [...orderProducts];
                      updated[index].qty = parseInt(value) || 0;
                      setOrderProducts(updated);
                    }}
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={handleAddOrderProduct}>
              <Plus size={16} color="#1E3EA6" />
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>

            {orderProducts.length > 0 && (
              <View style={styles.orderSummary}>
                <View style={styles.summaryRow}>
                  <Text>Subtotal</Text>
                  <Text>Rs 2,500</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text>Tax (18%)</Text>
                  <Text>Rs 450</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.totalRow}>
                  <Text style={{ fontWeight: '600' }}>Total</Text>
                  <Text style={{ fontWeight: '600', color: '#1E3EA6' }}>Rs 2,950</Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmOrder}>
                <Text style={styles.confirmButtonText}>Confirm Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setActiveForm(null);
                  setOrderProducts([]);
                  setSelectedCustomer('');
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

  const renderCustomerModal = () => (
    <Modal
      visible={activeForm === 'customer'}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setActiveForm(null)}
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
            <View style={styles.formGroup}>
              <Text style={styles.label}>Shop Name</Text>
              <TextInput style={styles.input} placeholder="Enter shop name" />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Owner Name</Text>
              <TextInput style={styles.input} placeholder="Enter owner name" />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput style={styles.input} placeholder="Enter street address" />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput style={styles.input} placeholder="Enter city" />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+94 77 XXX XXXX"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="customer@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmCustomer}>
                <Text style={styles.confirmButtonText}>Register</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setActiveForm(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderSuccessModal = () => (
    <Modal visible={showSuccess} transparent animationType="fade">
      <View style={styles.successOverlay}>
        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={40} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Success!</Text>
          <Text style={styles.successMessage}>Action completed successfully</Text>
        </View>
      </View>
    </Modal>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home': return renderHomeTab();
      case 'preorders': return renderPreOrdersTab();
      case 'stock': return renderStockTab();
      case 'history': return renderHistoryTab();
      case 'profile': return renderProfileTab();
      default: return renderHomeTab();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.mainContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>

      {renderBottomNav()}
      {renderOrderModal()}
      {renderCustomerModal()}
      {renderSuccessModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#1E3EA6',
    padding: 16,
    paddingTop: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerText: {
    flexDirection: 'column',
  },
  companyName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  roleText: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 14,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    backgroundColor: '#DB2777',
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 12,
    marginTop: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  mainContent: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  cardContent: {
    padding: 16,
  },
  visitCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  visitCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FBBF24',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  visitAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  visitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  visitAmount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  orderButton: {
    backgroundColor: '#1E3EA6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  preOrderCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  preOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  preOrderCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  preOrderId: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  preOrderDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  productsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    color: '#374151',
  },
  productPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  declineButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  statusMessageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  stockInfo: {
    flex: 1,
  },
  stockProduct: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  stockPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stockGood: {
    backgroundColor: '#D1FAE5',
  },
  stockLow: {
    backgroundColor: '#FEF3C7',
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceNo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusPaid: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  statusPartial: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FBBF24',
  },
  customerName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  historyAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  dueText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 2,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    backgroundColor: '#1E3EA6',
    borderRadius: 40,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatarText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  editButton: {
    backgroundColor: '#1E3EA6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  navButtonActive: {
    backgroundColor: '#EFF6FF',
  },
  navLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#1E3EA6',
    fontWeight: '500',
  },
  navBadge: {
    position: 'absolute',
    top: 4,
    right: 20,
    backgroundColor: '#DB2777',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
  },
  selectValue: {
    fontSize: 16,
    color: '#111827',
  },
  orderProductCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    color: '#1E3EA6',
    fontWeight: '500',
  },
  orderSummary: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#1E3EA6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: '80%',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default Dashboard;