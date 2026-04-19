// frontend-mobile/src/screens/customer/Dashboard.tsx
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
    Modal,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import {
    ShoppingCart,
    Gift,
    Home,
    User,
    FileText,
    CreditCard,
    Bell,
    Package,
    TrendingUp,
    Calendar,
    Star,
    Plus,
    Trash2,
    Award,
    CheckCircle2,
    Clock,
    X,
    ChevronRight,
    AlertCircle,
    Phone,
    Mail,
    MapPin,
    DollarSign,
    Edit2,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import productService, { Product } from '../../services/productService';
import orderService, { PreOrder } from '../../services/orderService';
import profileService, { CustomerProfile } from '../../services/profileService';
import loyaltyService from '../../services/loyaltyService';
import api from '../../services/api';

// Define types
type CustomerDashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CustomerDashboard'>;

interface Props {
    navigation: CustomerDashboardScreenNavigationProp;
}

interface PurchaseHistoryItem {
    order_id: number;
    order_number: string;
    order_date: string;
    total_items: number;
    net_amount: number;
    payment_status: string;
    order_status: string;
}

interface PreOrderProductItem {
    id: string;
    product_id: number;
    product: string;
    productName: string;
    qty: number;
    price: number;
    searchTerm: string;
}

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    created_at: string;
    is_read: boolean;
}

const CustomerDashboard: React.FC<Props> = ({ navigation }) => {
    const { user, logout, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState('home');
    const [showLoyaltyAnimation, setShowLoyaltyAnimation] = useState(false);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [activeForm, setActiveForm] = useState<string | null>(null);
    const [preOrderProducts, setPreOrderProducts] = useState<PreOrderProductItem[]>([
        { id: '1', product_id: 0, product: '', productName: '', qty: 0, price: 0, searchTerm: '' }
    ]);
    const [dailySaleSearch, setDailySaleSearch] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Profile state
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editProfileData, setEditProfileData] = useState<UpdateProfileData>({
        employee_id: '',
        name: '',
        email: '',
        contact: '',
        address: '',
        shop_name: '',
    });
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Data states
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
    const [preOrdersLoading, setPreOrdersLoading] = useState(false);
    const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);
    const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false);
    const [loyaltyStats, setLoyaltyStats] = useState<any>(null);
    const [loyaltyStatsLoading, setLoyaltyStatsLoading] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);

    // Van visit info
    const [nextVanVisit, setNextVanVisit] = useState<{ date: string; message: string } | null>(null);

    // Load customer profile
    const loadCustomerProfile = async () => {
        try {
            setProfileLoading(true);
            const profileData = await profileService.getCustomerProfile();
            setProfile(profileData);
            setEditProfileData({
                employee_id: profileData.customer_id?.toString() || '',
                name: profileData.name,
                email: profileData.email,
                contact: profileData.contact,
                address: profileData.address,
                shop_name: profileData.shop_name,
            });
        } catch (error: any) {
            console.error('Load profile error:', error);
            Alert.alert('Error', error.message || 'Failed to load profile');
        } finally {
            setProfileLoading(false);
        }
    };

    // Load products
    const loadProducts = async () => {
        try {
            setProductsLoading(true);
            const productList = await productService.getProducts();
            setProducts(productList);
        } catch (error: any) {
            console.error('Load products error:', error);
        } finally {
            setProductsLoading(false);
        }
    };

    // Load customer pre-orders
    const loadCustomerPreOrders = async () => {
        const customerId = profile?.customer_id || user?.customer_id;
        if (!customerId) return;
        try {
            setPreOrdersLoading(true);
            const orders = await orderService.getCustomerPreOrders(customerId);
            setPreOrders(orders);
        } catch (error: any) {
            console.error('Load pre-orders error:', error);
            setPreOrders([]);
        } finally {
            setPreOrdersLoading(false);
        }
    };

    // Load purchase history
    const loadPurchaseHistory = async () => {
        const customerId = profile?.customer_id || user?.customer_id;
        if (!customerId) return;
        try {
            setPurchaseHistoryLoading(true);
            const response: any = await orderService.getCustomerOrders(customerId);
            setPurchaseHistory(response.orders || []);
        } catch (error: any) {
            console.error('Load purchase history error:', error);
            setPurchaseHistory([]);
        } finally {
            setPurchaseHistoryLoading(false);
        }
    };

    // Load loyalty stats
    const loadLoyaltyStats = async () => {
        // Get customer_id from profile or user
        const customerId = profile?.customer_id || user?.customer_id;
        if (!customerId) {
            console.log('No customer ID available for loyalty stats');
            // Set default loyalty stats
            setLoyaltyStats({
                total_points: 0,
                current_level: {
                    level_name: 'Blue',
                    discount_percentage: 0,
                    credit_limit: 50000
                },
                next_level: null,
                points_to_next_level: 1000,
                total_points_earned: 0,
                total_points_redeemed: 0
            });
            return;
        }

        try {
            setLoyaltyStatsLoading(true);
            const stats = await loyaltyService.getLoyaltyStats(customerId);
            setLoyaltyStats(stats);
        } catch (error: any) {
            console.error('Load loyalty stats error:', error);
            // Set default loyalty stats on error
            setLoyaltyStats({
                total_points: 0,
                current_level: {
                    level_name: 'Blue',
                    discount_percentage: 0,
                    credit_limit: 50000
                },
                next_level: null,
                points_to_next_level: 1000,
                total_points_earned: 0,
                total_points_redeemed: 0
            });
        } finally {
            setLoyaltyStatsLoading(false);
        }
    };

    // Load notifications
    const loadNotifications = async () => {
        try {
            setNotificationsLoading(true);
            const response: any = await api.get('/notifications/customer');
            if (response.success && response.data) {
                setNotifications(response.data);
            }
        } catch (error: any) {
            console.error('Load notifications error:', error);
        } finally {
            setNotificationsLoading(false);
        }
    };

    // Load van visit info
    const loadVanVisitInfo = async () => {
        if (!user?.customer_id) return;
        try {
            const response: any = await api.get(`/customers/${user.customer_id}/next-visit`);
            if (response.success && response.data) {
                setNextVanVisit(response.data);
            }
        } catch (error: any) {
            console.error('Load van visit error:', error);
        }
    };

    // Load all data
    const loadAllData = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                loadCustomerProfile(),
                loadProducts(),
                loadCustomerPreOrders(),
                loadPurchaseHistory(),
                loadLoyaltyStats(),
                loadNotifications(),
                loadVanVisitInfo(),
            ]);
        } catch (error) {
            console.error('Load data error:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const handleRefresh = async () => {
        await loadAllData();
        await refreshUser();
    };

    // Update profile
    const handleUpdateProfile = async () => {
        if (!profile) return;

        setLoading(true);
        try {
            // Only send fields that customers are allowed to update
            const updateData = {
                name: editProfileData.name,
                email: editProfileData.email,
                contact: editProfileData.contact,
                address: editProfileData.address,
                shop_name: editProfileData.shop_name,
            };

            console.log('Sending update data:', updateData);

            const updatedProfile = await profileService.updateCustomerProfile(
                profile.customer_id,
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

    // Change password
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

    // Add pre-order product
    const addPreOrderProduct = () => {
        setPreOrderProducts([
            ...preOrderProducts,
            { id: Date.now().toString(), product_id: 0, product: '', productName: '', qty: 0, price: 0, searchTerm: '' }
        ]);
    };

    // Remove pre-order product
    const removePreOrderProduct = (id: string) => {
        if (preOrderProducts.length > 1) {
            setPreOrderProducts(preOrderProducts.filter(item => item.id !== id));
        }
    };

    // Update pre-order product
    const updatePreOrderProduct = (id: string, field: keyof PreOrderProductItem, value: any) => {
        setPreOrderProducts(prev =>
            prev.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    // Select product from search
    const selectProduct = (id: string, productData: Product) => {
        setPreOrderProducts(prev =>
            prev.map(item =>
                item.id === id
                    ? {
                        ...item,
                        product_id: productData.product_id,
                        product: productData.product_name,
                        productName: productData.product_name,
                        price: productData.unit_price,
                        searchTerm: '',
                    }
                    : item
            )
        );
    };

    // Open pre-order with product
    const openPreOrderWithProduct = (productData: Product) => {
        setPreOrderProducts([
            {
                id: Date.now().toString(),
                product_id: productData.product_id,
                product: productData.product_name,
                productName: productData.product_name,
                qty: 1,
                price: productData.unit_price,
                searchTerm: '',
            }
        ]);
        setActiveForm('preorder');
    };

    // Create pre-order
    const handleConfirmPreOrder = async () => {
        if (!profile) {
            Alert.alert('Error', 'Please login to place an order');
            return;
        }

        const validProducts = preOrderProducts.filter(p => p.product_id && p.qty > 0);
        if (validProducts.length === 0) {
            Alert.alert('Error', 'Please add at least one product with quantity');
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                customer_id: profile.customer_id,
                items: validProducts.map(p => ({
                    product_id: p.product_id,
                    quantity: p.qty,
                    price: p.price,
                })),
            };

            await orderService.createPreOrder(orderData);

            setActiveForm(null);
            setPreOrderProducts([{ id: '1', product_id: 0, product: '', productName: '', qty: 0, price: 0, searchTerm: '' }]);
            setSuccessMessage('Pre-order placed successfully!');
            setShowSuccessAnimation(true);
            setTimeout(() => setShowSuccessAnimation(false), 3000);

            await loadCustomerPreOrders();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to place pre-order');
        } finally {
            setLoading(false);
        }
    };

    // Submit daily sale
    const handleDailySaleSubmit = async () => {
        if (!profile) return;

        setLoading(true);
        try {
            // This would connect to a daily sale endpoint
            await api.post('/daily-sales', {
                customer_id: profile.customer_id,
                product_name: dailySaleSearch,
            });

            setActiveForm(null);
            setDailySaleSearch('');
            setShowLoyaltyAnimation(true);
            setTimeout(() => setShowLoyaltyAnimation(false), 3000);
            setSuccessMessage('Daily sale updated! +50 loyalty points earned.');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);

            await loadLoyaltyStats();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit daily sale');
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const markNotificationAsRead = async (notificationId: number) => {
        try {
            await api.put(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, is_read: true } : n
                )
            );
        } catch (error) {
            console.error('Mark notification read error:', error);
        }
    };

    // Handle logout
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

    // Get loyalty color based on level
    const getLoyaltyColor = () => {
        const levelName = loyaltyStats?.current_level?.level_name || 'Blue';
        switch (levelName) {
            case 'Blue': return { from: '#60A5FA', to: '#3B82F6' };
            case 'Bronze': return { from: '#F59E0B', to: '#D97706' };
            case 'Silver': return { from: '#9CA3AF', to: '#6B7280' };
            case 'Gold': return { from: '#FBBF24', to: '#D97706' };
            case 'Platinum': return { from: '#A78BFA', to: '#7C3AED' };
            default: return { from: '#60A5FA', to: '#3B82F6' };
        }
    };

    // Get status color for pre-order
    const getStatusColor = (status: PreOrder['status']) => {
        switch (status) {
            case 'PENDING': return { bg: '#FEF3C7', text: '#92400E', border: '#FBBF24' };
            case 'CONFIRMED': return { bg: '#DBEAFE', text: '#1E40AF', border: '#60A5FA' };
            case 'DECLINED': return { bg: '#FEE2E2', text: '#991B1B', border: '#F87171' };
            case 'DELIVERED': return { bg: '#D1FAE5', text: '#065F46', border: '#34D399' };
            default: return { bg: '#FEF3C7', text: '#92400E', border: '#FBBF24' };
        }
    };

    // Get status icon for pre-order
    const getStatusIcon = (status: PreOrder['status']) => {
        switch (status) {
            case 'PENDING': return Clock;
            case 'CONFIRMED': return CheckCircle2;
            case 'DECLINED': return X;
            case 'DELIVERED': return Package;
            default: return Clock;
        }
    };

    // ==================== RENDER METHODS ====================

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
                        <Text style={styles.roleText}>{profile?.shop_name || 'Customer'}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => setShowNotifications(true)}
                >
                    <Bell size={24} color="#FFFFFF" />
                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>
                                {notifications.filter(n => !n.is_read).length}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Quick Info Cards */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Star size={16} color="#FFFFFF" />
                    <Text style={styles.statLabel}>Loyalty Points</Text>
                    <Text style={styles.statValue}>
                        {loyaltyStats?.total_points?.toLocaleString() || 0}
                    </Text>
                </View>
                <View style={styles.statCard}>
                    <Calendar size={16} color="#FFFFFF" />
                    <Text style={styles.statLabel}>Next Visit</Text>
                    <Text style={styles.statValue}>
                        {nextVanVisit?.date ? new Date(nextVanVisit.date).toLocaleDateString() : 'TBD'}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderBottomNav = () => (
        <View style={styles.bottomNav}>
            {[
                { key: 'home', icon: Home, label: 'Home' },
                { key: 'history', icon: FileText, label: 'History' },
                { key: 'payments', icon: CreditCard, label: 'Payments' },
                { key: 'rewards', icon: Gift, label: 'Rewards' },
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
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderHomeTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Alert Banner for Van Visit */}
            {nextVanVisit && (
                <View style={styles.alertBanner}>
                    <Bell size={20} color="#1E40AF" />
                    <View style={styles.alertContent}>
                        <Text style={styles.alertTitle}>Van Visit {nextVanVisit.date ? `on ${new Date(nextVanVisit.date).toLocaleDateString()}` : 'Scheduled'}</Text>
                        <Text style={styles.alertMessage}>{nextVanVisit.message || 'Your delivery van will visit soon'}</Text>
                    </View>
                </View>
            )}

            {/* Available Products */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Package size={20} color="#1E3EA6" />
                    <Text style={styles.cardTitle}>Available Products</Text>
                </View>
                <View style={styles.cardContent}>
                    {productsLoading ? (
                        <ActivityIndicator size="large" color="#1E3EA6" />
                    ) : products.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Package size={48} color="#9CA3AF" />
                            <Text style={styles.emptyStateText}>No products available</Text>
                        </View>
                    ) : (
                        products.slice(0, 5).map(product => (
                            <View key={product.product_id} style={styles.productCard}>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName}>{product.product_name}</Text>
                                    <Text style={styles.productPrice}>Rs {product.unit_price}</Text>
                                </View>
                                <View style={styles.productActions}>
                                    <View style={[
                                        styles.stockBadge,
                                        product.stock_quantity > 10 ? styles.stockIn :
                                            product.stock_quantity > 0 ? styles.stockLow : styles.stockOut
                                    ]}>
                                        <Text style={styles.stockText}>
                                            {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.productButton, product.stock_quantity === 0 && styles.productButtonDisabled]}
                                        onPress={() => openPreOrderWithProduct(product)}
                                        disabled={product.stock_quantity === 0}
                                    >
                                        <ShoppingCart size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                    {products.length > 5 && (
                        <TouchableOpacity style={styles.viewAllButton}>
                            <Text style={styles.viewAllText}>View All Products</Text>
                            <ChevronRight size={16} color="#1E3EA6" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Pre Orders Section */}
            {preOrders.length > 0 && (
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <ShoppingCart size={20} color="#1E3EA6" />
                        <Text style={styles.cardTitle}>My Pre-Orders</Text>
                    </View>
                    <View style={styles.cardContent}>
                        {preOrdersLoading ? (
                            <ActivityIndicator size="large" color="#1E3EA6" />
                        ) : (
                            preOrders.slice(0, 2).map((order) => {
                                const StatusIcon = getStatusIcon(order.status);
                                const statusColor = getStatusColor(order.status);

                                return (
                                    <View key={order.pre_order_id} style={styles.preOrderCard}>
                                        <View style={styles.preOrderHeader}>
                                            <View>
                                                <Text style={styles.preOrderId}>{order.pre_order_number}</Text>
                                                <Text style={styles.preOrderDate}>
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg, borderColor: statusColor.border }]}>
                                                <StatusIcon size={12} color={statusColor.text} />
                                                <Text style={[styles.statusText, { color: statusColor.text }]}>
                                                    {order.status}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.productsList}>
                                            {order.items?.slice(0, 2).map((product, idx) => (
                                                <View key={idx} style={styles.productItem}>
                                                    <Text style={styles.productNameSmall}>
                                                        {product.product_name} x {product.quantity}
                                                    </Text>
                                                    <Text style={styles.productPriceSmall}>
                                                        Rs {(product.price * product.quantity).toLocaleString()}
                                                    </Text>
                                                </View>
                                            ))}
                                            {order.items && order.items.length > 2 && (
                                                <Text style={styles.moreItemsText}>
                                                    +{order.items.length - 2} more items
                                                </Text>
                                            )}

                                            <View style={styles.divider} />
                                            <View style={styles.totalItem}>
                                                <Text style={{ fontWeight: '600' }}>Total</Text>
                                                <Text style={{ color: '#1E3EA6', fontWeight: '600' }}>
                                                    Rs {order.net_amount.toLocaleString()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </View>
            )}

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => setActiveForm('preorder')}
                >
                    <View style={[styles.quickActionIcon, { backgroundColor: '#1E3EA6' }]}>
                        <ShoppingCart size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.quickActionText}>Place Pre-Order</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => setActiveForm('dailysale')}
                >
                    <View style={[styles.quickActionIcon, { backgroundColor: '#10B981' }]}>
                        <TrendingUp size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.quickActionText}>Update Daily Sale</Text>
                </TouchableOpacity>
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
                    {purchaseHistoryLoading ? (
                        <ActivityIndicator size="large" color="#1E3EA6" />
                    ) : purchaseHistory.length === 0 ? (
                        <View style={styles.emptyState}>
                            <FileText size={48} color="#9CA3AF" />
                            <Text style={styles.emptyStateText}>No purchase history</Text>
                        </View>
                    ) : (
                        purchaseHistory.map((order) => (
                            <View key={order.order_id} style={styles.historyItem}>
                                <View style={styles.historyHeader}>
                                    <Text style={styles.invoiceNo}>{order.order_number}</Text>
                                    <Text style={styles.orderAmount}>Rs {order.net_amount.toLocaleString()}</Text>
                                </View>
                                <View style={styles.historyDetails}>
                                    <Text style={styles.orderDate}>
                                        {new Date(order.order_date).toLocaleDateString()}
                                    </Text>
                                    <Text style={styles.orderItems}>{order.total_items || 0} items</Text>
                                </View>
                                <View style={styles.paymentStatusContainer}>
                                    <View style={[
                                        styles.paymentStatusBadge,
                                        order.payment_status === 'PAID' ? styles.statusPaid :
                                            order.payment_status === 'PARTIAL' ? styles.statusPartial : styles.statusPending
                                    ]}>
                                        <Text style={styles.paymentStatusText}>
                                            {order.payment_status === 'PAID' ? 'Paid' :
                                                order.payment_status === 'PARTIAL' ? 'Partial' : 'Pending'}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.orderStatusBadge,
                                        order.order_status === 'DELIVERED' ? styles.statusDelivered :
                                            order.order_status === 'CANCELLED' ? styles.statusCancelled : styles.statusProcessing
                                    ]}>
                                        <Text style={styles.orderStatusText}>
                                            {order.order_status}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </View>
        </ScrollView>
    );

    const renderPaymentsTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <CreditCard size={20} color="#1E3EA6" />
                    <Text style={styles.cardTitle}>Payment Status</Text>
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.paymentStats}>
                        <View style={styles.paymentStat}>
                            <Text style={styles.paymentLabel}>Total Outstanding</Text>
                            <Text style={styles.paymentAmount}>
                                Rs {purchaseHistory
                                    .filter(o => o.payment_status !== 'PAID')
                                    .reduce((sum, o) => sum + (o.net_amount), 0)
                                    .toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.paymentStat}>
                            <Text style={styles.paymentLabel}>Credit Limit</Text>
                            <Text style={styles.paymentLimit}>
                                Rs {loyaltyStats?.current_level?.credit_limit?.toLocaleString() || 0}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[
                                styles.progressFill,
                                {
                                    width: `${Math.min(100, (purchaseHistory
                                        .filter(o => o.payment_status !== 'PAID')
                                        .reduce((sum, o) => sum + (o.net_amount), 0) /
                                        (loyaltyStats?.current_level?.credit_limit || 1)) * 100)}%`
                                }
                            ]} />
                        </View>
                        <Text style={styles.progressText}>
                            {Math.min(100, Math.round((purchaseHistory
                                .filter(o => o.payment_status !== 'PAID')
                                .reduce((sum, o) => sum + (o.net_amount), 0) /
                                (loyaltyStats?.current_level?.credit_limit || 1)) * 100))}% of credit limit used
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.paymentButton}>
                        <Text style={styles.paymentButtonText}>Make Payment</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    const renderRewardsTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Gift size={20} color="#1E3EA6" />
                    <Text style={styles.cardTitle}>Loyalty Rewards</Text>
                </View>
                <View style={[styles.cardContent, styles.centerContent]}>
                    {loyaltyStatsLoading ? (
                        <ActivityIndicator size="large" color="#1E3EA6" />
                    ) : loyaltyStats ? (
                        <>
                            <View style={[styles.loyaltyBadge, { backgroundColor: getLoyaltyColor().from }]}>
                                <Award size={40} color="#FFFFFF" />
                            </View>

                            <Text style={styles.loyaltyTitle}>
                                {loyaltyStats.current_level?.level_name || 'Blue'} Status
                            </Text>
                            <Text style={styles.loyaltyPoints}>
                                {loyaltyStats.total_points?.toLocaleString() || 0} Points
                            </Text>

                            <View style={styles.loyaltyBenefits}>
                                <View style={styles.benefitItem}>
                                    <Text style={styles.benefitLabel}>Current Discount</Text>
                                    <Text style={styles.benefitValue}>
                                        {loyaltyStats.current_level?.discount_percentage || 0}%
                                    </Text>
                                </View>
                                <View style={styles.benefitItem}>
                                    <Text style={styles.benefitLabel}>Credit Limit</Text>
                                    <Text style={styles.benefitValue}>
                                        Rs {(loyaltyStats.current_level?.credit_limit || 0).toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.benefitItem}>
                                    <Text style={styles.benefitLabel}>Total Points Earned</Text>
                                    <Text style={styles.benefitValue}>
                                        {loyaltyStats.total_points_earned?.toLocaleString() || 0}
                                    </Text>
                                </View>
                            </View>

                            {loyaltyStats.next_level && (
                                <View style={styles.nextTierCard}>
                                    <Text style={styles.nextTierTitle}>
                                        Next Tier: {loyaltyStats.next_level.level_name}
                                    </Text>
                                    <Text style={styles.nextTierText}>
                                        {loyaltyStats.points_to_next_level} points needed
                                    </Text>
                                    <View style={styles.tierProgressBar}>
                                        <View
                                            style={[
                                                styles.tierProgressFill,
                                                {
                                                    width: `${Math.min(100, (loyaltyStats.total_points /
                                                        (loyaltyStats.total_points + loyaltyStats.points_to_next_level)) * 100)}%`
                                                }
                                            ]}
                                        />
                                    </View>
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <Gift size={48} color="#9CA3AF" />
                            <Text style={styles.emptyStateText}>No loyalty data available</Text>
                        </View>
                    )}
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
                    {profileLoading ? (
                        <ActivityIndicator size="large" color="#1E3EA6" />
                    ) : isEditingProfile ? (
                        // Edit Profile Form
                        <>
                            <View style={styles.profileAvatar}>
                                <Text style={styles.avatarText}>
                                    {profile?.shop_name?.charAt(0).toUpperCase() || 'C'}
                                </Text>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Shop Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editProfileData.shop_name}
                                    onChangeText={(text) => setEditProfileData({ ...editProfileData, shop_name: text })}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Contact Person</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editProfileData.name}
                                    onChangeText={(text) => setEditProfileData({ ...editProfileData, name: text })}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Address</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editProfileData.address}
                                    onChangeText={(text) => setEditProfileData({ ...editProfileData, address: text })}
                                    multiline
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Phone</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editProfileData.contact}
                                    onChangeText={(text) => setEditProfileData({ ...editProfileData, contact: text })}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editProfileData.email}
                                    onChangeText={(text) => setEditProfileData({ ...editProfileData, email: text })}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.buttonGroup}>
                                <TouchableOpacity
                                    style={[styles.editButton, { backgroundColor: '#10B981', flex: 1 }]}
                                    onPress={handleUpdateProfile}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Text style={styles.editButtonText}>Save Changes</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.editButton, { backgroundColor: '#6B7280', flex: 1 }]}
                                    onPress={() => {
                                        setIsEditingProfile(false);
                                        setEditProfileData({
                                            employee_id: profile?.customer_id?.toString() || '',
                                            name: profile?.name,
                                            email: profile?.email,
                                            contact: profile?.contact,
                                            address: profile?.address,
                                            shop_name: profile?.shop_name,
                                        });
                                    }}
                                >
                                    <Text style={styles.editButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        // View Profile
                        <>
                            <View style={styles.profileAvatar}>
                                <Text style={styles.avatarText}>
                                    {profile?.shop_name?.charAt(0).toUpperCase() || 'C'}
                                </Text>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Shop Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profile?.shop_name}
                                    editable={false}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Contact Person</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profile?.name}
                                    editable={false}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Address</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profile?.address || 'Not provided'}
                                    editable={false}
                                    multiline
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>City</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profile?.city || 'Not provided'}
                                    editable={false}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Phone</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profile?.contact}
                                    editable={false}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profile?.email}
                                    editable={false}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Delivery Route</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profile?.route_name || 'Not assigned'}
                                    editable={false}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => setIsEditingProfile(true)}
                            >
                                <Edit2 size={16} color="#FFFFFF" />
                                <Text style={styles.editButtonText}>Edit Profile</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.changePasswordButton}
                                onPress={() => setShowChangePassword(true)}
                            >
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
            <Modal
                visible={showChangePassword}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowChangePassword(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                                <X size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Current Password</Text>
                                <TextInput
                                    style={styles.input}
                                    secureTextEntry
                                    value={passwordData.currentPassword}
                                    onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>New Password</Text>
                                <TextInput
                                    style={styles.input}
                                    secureTextEntry
                                    value={passwordData.newPassword}
                                    onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Confirm New Password</Text>
                                <TextInput
                                    style={styles.input}
                                    secureTextEntry
                                    value={passwordData.confirmPassword}
                                    onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleChangePassword}
                                disabled={passwordLoading}
                            >
                                {passwordLoading ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Update Password</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );

    // ==================== MODAL RENDER METHODS ====================

    const renderPreOrderModal = () => (
        <Modal
            visible={activeForm === 'preorder'}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
                setActiveForm(null);
                setPreOrderProducts([{ id: '1', product_id: 0, product: '', productName: '', qty: 0, price: 0, searchTerm: '' }]);
            }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Place Pre-Order</Text>
                        <TouchableOpacity onPress={() => setActiveForm(null)}>
                            <X size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {preOrderProducts.map((item, index) => {
                            const filteredProducts = products.filter(p =>
                                p.product_name.toLowerCase().includes(item.searchTerm.toLowerCase()) &&
                                p.product_name !== item.product
                            );

                            return (
                                <View key={item.id} style={styles.orderProductCard}>
                                    <View style={styles.productHeader}>
                                        <Text style={styles.productLabel}>Product {index + 1}</Text>
                                        {preOrderProducts.length > 1 && (
                                            <TouchableOpacity onPress={() => removePreOrderProduct(item.id)}>
                                                <Trash2 size={18} color="#DC2626" />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Product Name</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Search products..."
                                            value={item.product || item.searchTerm}
                                            onChangeText={(value) => {
                                                if (!item.product) {
                                                    updatePreOrderProduct(item.id, 'searchTerm', value);
                                                } else {
                                                    updatePreOrderProduct(item.id, 'product', '');
                                                    updatePreOrderProduct(item.id, 'product_id', 0);
                                                    updatePreOrderProduct(item.id, 'productName', '');
                                                    updatePreOrderProduct(item.id, 'price', 0);
                                                    updatePreOrderProduct(item.id, 'searchTerm', value);
                                                }
                                            }}
                                        />
                                        {item.searchTerm && !item.product && filteredProducts.length > 0 && (
                                            <View style={styles.productSuggestions}>
                                                {filteredProducts.map(p => (
                                                    <TouchableOpacity
                                                        key={p.product_id}
                                                        style={styles.productSuggestion}
                                                        onPress={() => selectProduct(item.id, p)}
                                                    >
                                                        <Text>{p.product_name} - Rs {p.unit_price}</Text>
                                                        {p.stock_quantity > 0 && (
                                                            <Text style={styles.stockHint}>
                                                                ({p.stock_quantity} in stock)
                                                            </Text>
                                                        )}
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Quantity</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter quantity"
                                            keyboardType="numeric"
                                            value={item.qty.toString()}
                                            onChangeText={(value) => updatePreOrderProduct(item.id, 'qty', parseInt(value) || 0)}
                                        />
                                    </View>

                                    {item.product && item.qty > 0 && (
                                        <Text style={styles.subtotalText}>
                                            Subtotal: Rs {(item.price * item.qty).toLocaleString()}
                                        </Text>
                                    )}
                                </View>
                            );
                        })}

                        <TouchableOpacity style={styles.addButton} onPress={addPreOrderProduct}>
                            <Plus size={16} color="#1E3EA6" />
                            <Text style={styles.addButtonText}>Add More Products</Text>
                        </TouchableOpacity>

                        {preOrderProducts.some(p => p.product_id && p.qty > 0) && (
                            <View style={styles.orderSummary}>
                                <Text style={styles.summaryTitle}>Order Summary</Text>
                                <View style={styles.summaryRow}>
                                    <Text>Total Amount</Text>
                                    <Text style={styles.summaryAmount}>
                                        Rs {preOrderProducts.reduce((sum, p) => sum + (p.price * p.qty), 0).toLocaleString()}
                                    </Text>
                                </View>
                                {loyaltyStats?.current_level?.discount_percentage > 0 && (
                                    <>
                                        <View style={styles.summaryRow}>
                                            <Text>Discount ({loyaltyStats.current_level.discount_percentage}%)</Text>
                                            <Text style={{ color: '#10B981' }}>
                                                - Rs {Math.round(preOrderProducts.reduce((sum, p) => sum + (p.price * p.qty), 0) *
                                                    (loyaltyStats.current_level.discount_percentage / 100)).toLocaleString()}
                                            </Text>
                                        </View>
                                        <View style={styles.divider} />
                                        <View style={styles.summaryRow}>
                                            <Text style={{ fontWeight: '600' }}>Net Amount</Text>
                                            <Text style={{ fontWeight: '600', color: '#1E3EA6' }}>
                                                Rs {Math.round(preOrderProducts.reduce((sum, p) => sum + (p.price * p.qty), 0) *
                                                    (1 - (loyaltyStats.current_level.discount_percentage / 100))).toLocaleString()}
                                            </Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleConfirmPreOrder}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.confirmButtonText}>Confirm Pre-Order</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const renderDailySaleModal = () => (
        <Modal
            visible={activeForm === 'dailysale'}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
                setActiveForm(null);
                setDailySaleSearch('');
            }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Update Daily Sale</Text>
                        <TouchableOpacity onPress={() => setActiveForm(null)}>
                            <X size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalBody}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Product Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Search product..."
                                value={dailySaleSearch}
                                onChangeText={setDailySaleSearch}
                            />
                            {dailySaleSearch && (
                                <View style={styles.productSuggestions}>
                                    {products.filter(p =>
                                        p.product_name.toLowerCase().includes(dailySaleSearch.toLowerCase())
                                    ).slice(0, 5).map(p => (
                                        <TouchableOpacity
                                            key={p.product_id}
                                            style={styles.productSuggestion}
                                            onPress={() => setDailySaleSearch(p.product_name)}
                                        >
                                            <Text>{p.product_name}</Text>
                                            <Text style={styles.suggestionPrice}>Rs {p.unit_price}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Sold Quantity</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter quantity sold"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                💡 You'll earn 10 loyalty points for every Rs 1,000 spent!
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleDailySaleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.confirmButtonText}>Submit Sale</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderNotificationsModal = () => (
        <Modal
            visible={showNotifications}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowNotifications(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Notifications</Text>
                        <TouchableOpacity onPress={() => setShowNotifications(false)}>
                            <X size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {notificationsLoading ? (
                            <ActivityIndicator size="large" color="#1E3EA6" />
                        ) : notifications.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Bell size={48} color="#9CA3AF" />
                                <Text style={styles.emptyStateText}>No notifications</Text>
                            </View>
                        ) : (
                            notifications.map((notification) => (
                                <TouchableOpacity
                                    key={notification.id}
                                    style={[
                                        styles.notificationCard,
                                        { backgroundColor: notification.is_read ? '#F9FAFB' : '#EFF6FF' }
                                    ]}
                                    onPress={() => markNotificationAsRead(notification.id)}
                                >
                                    <View style={styles.notificationContent}>
                                        <Text style={[
                                            styles.notificationTitle,
                                            !notification.is_read && styles.notificationTitleUnread
                                        ]}>
                                            {notification.title}
                                        </Text>
                                        <Text style={styles.notificationMessage}>
                                            {notification.message}
                                        </Text>
                                        <Text style={styles.notificationTime}>
                                            {new Date(notification.created_at).toLocaleDateString()} at{' '}
                                            {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    {!notification.is_read && <View style={styles.unreadDot} />}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const renderSuccessModal = () => (
        <Modal visible={showSuccessAnimation} transparent animationType="fade">
            <View style={styles.successOverlay}>
                <View style={styles.successContent}>
                    <View style={styles.successIcon}>
                        <CheckCircle2 size={40} color="#10B981" />
                    </View>
                    <Text style={styles.successTitle}>Order Sent Successfully!</Text>
                    <Text style={styles.successMessage}>
                        Your pre-order has been sent to the sales representative
                    </Text>
                </View>
            </View>
        </Modal>
    );

    const renderLoyaltyModal = () => (
        <Modal visible={showLoyaltyAnimation} transparent animationType="fade">
            <View style={styles.successOverlay}>
                <View style={styles.successContent}>
                    <View style={[styles.successIcon, { backgroundColor: '#F59E0B' }]}>
                        <Gift size={40} color="#FFFFFF" />
                    </View>
                    <Text style={styles.successTitle}>+50 Points!</Text>
                    <Text style={styles.successMessage}>Your loyalty points have been updated</Text>
                </View>
            </View>
        </Modal>
    );

    const renderSuccessMessageModal = () => (
        <Modal visible={showSuccess} transparent animationType="fade">
            <View style={styles.successOverlay}>
                <View style={styles.successContent}>
                    <View style={styles.successIcon}>
                        <CheckCircle2 size={40} color="#10B981" />
                    </View>
                    <Text style={styles.successTitle}>Success!</Text>
                    <Text style={styles.successMessage}>{successMessage}</Text>
                </View>
            </View>
        </Modal>
    );

    // Main render
    const renderTabContent = () => {
        switch (activeTab) {
            case 'home': return renderHomeTab();
            case 'history': return renderHistoryTab();
            case 'payments': return renderPaymentsTab();
            case 'rewards': return renderRewardsTab();
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
            {renderPreOrderModal()}
            {renderDailySaleModal()}
            {renderNotificationsModal()}
            {renderSuccessModal()}
            {renderLoyaltyModal()}
            {renderSuccessMessageModal()}
        </SafeAreaView>
    );
};

// ==================== STYLES ====================

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
    logoPlaceholder: {
        alignItems: 'center',
        marginRight: 12,
    },
    logoText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    logoSubtitle: {
        fontSize: 8,
        color: '#FFFFFF',
        opacity: 0.8,
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
        backgroundColor: '#DB2777',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
        paddingHorizontal: 4,
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
    alertBanner: {
        backgroundColor: '#DBEAFE',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    alertContent: {
        flex: 1,
        marginLeft: 12,
    },
    alertTitle: {
        color: '#1E40AF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    alertMessage: {
        color: '#1E40AF',
        fontSize: 13,
        opacity: 0.8,
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
    centerContent: {
        alignItems: 'center',
    },
    productCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        color: '#6B7280',
    },
    productActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stockBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    stockIn: {
        backgroundColor: '#D1FAE5',
    },
    stockLow: {
        backgroundColor: '#FEF3C7',
    },
    stockOut: {
        backgroundColor: '#FEE2E2',
    },
    stockText: {
        fontSize: 12,
        fontWeight: '500',
    },
    productButton: {
        backgroundColor: '#1E3EA6',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    productButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        marginTop: 8,
    },
    viewAllText: {
        color: '#1E3EA6',
        fontSize: 14,
        fontWeight: '500',
        marginRight: 4,
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
    preOrderId: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    preOrderDate: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    productsList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
    },
    productItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    productNameSmall: {
        fontSize: 14,
        color: '#374151',
    },
    productPriceSmall: {
        fontSize: 14,
        color: '#6B7280',
    },
    moreItemsText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    totalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
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
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 12,
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
    orderAmount: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '600',
    },
    historyDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    orderDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    orderItems: {
        fontSize: 12,
        color: '#6B7280',
    },
    paymentStatusContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    paymentStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    orderStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusPaid: {
        backgroundColor: '#D1FAE5',
    },
    statusPartial: {
        backgroundColor: '#FEF3C7',
    },
    statusPending: {
        backgroundColor: '#FEE2E2',
    },
    statusDelivered: {
        backgroundColor: '#D1FAE5',
    },
    statusCancelled: {
        backgroundColor: '#FEE2E2',
    },
    statusProcessing: {
        backgroundColor: '#DBEAFE',
    },
    paymentStatusText: {
        fontSize: 11,
        fontWeight: '500',
    },
    orderStatusText: {
        fontSize: 11,
        fontWeight: '500',
    },
    paymentStats: {
        gap: 16,
        marginBottom: 20,
    },
    paymentStat: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentLabel: {
        fontSize: 14,
        color: '#374151',
    },
    paymentAmount: {
        fontSize: 16,
        color: '#DC2626',
        fontWeight: '600',
    },
    paymentLimit: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#1E3EA6',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    paymentButton: {
        backgroundColor: '#1E3EA6',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    paymentButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loyaltyBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    loyaltyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    loyaltyPoints: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 24,
    },
    loyaltyBenefits: {
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        marginBottom: 20,
    },
    benefitItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    benefitLabel: {
        fontSize: 14,
        color: '#374151',
    },
    benefitValue: {
        fontSize: 14,
        color: '#1E3EA6',
        fontWeight: '600',
    },
    nextTierCard: {
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 16,
        width: '100%',
    },
    nextTierTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    nextTierText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    tierProgressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
    },
    tierProgressFill: {
        height: '100%',
        backgroundColor: '#1E3EA6',
        borderRadius: 4,
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
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    editButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    changePasswordButton: {
        borderWidth: 1,
        borderColor: '#1E3EA6',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    changePasswordText: {
        color: '#1E3EA6',
        fontSize: 16,
        fontWeight: '500',
    },
    logoutButton: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    logoutButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '500',
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
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
    orderProductCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
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
    productSuggestions: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        marginTop: 4,
        maxHeight: 150,
    },
    productSuggestion: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    stockHint: {
        fontSize: 12,
        color: '#10B981',
    },
    suggestionPrice: {
        fontSize: 12,
        color: '#6B7280',
    },
    subtotalText: {
        fontSize: 14,
        color: '#1E3EA6',
        fontWeight: '500',
        marginTop: 8,
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
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryAmount: {
        fontSize: 16,
        color: '#1E3EA6',
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    infoText: {
        fontSize: 12,
        color: '#92400E',
    },
    confirmButton: {
        backgroundColor: '#1E3EA6',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    notificationCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
        color: '#374151',
    },
    notificationTitleUnread: {
        fontWeight: '700',
        color: '#111827',
    },
    notificationMessage: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
    },
    notificationTime: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#DB2777',
        marginLeft: 8,
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
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
});

export default CustomerDashboard;