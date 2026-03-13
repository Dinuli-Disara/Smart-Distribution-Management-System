// src/screens/customer/Dashboard.tsx
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
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

// Define types
type CustomerDashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CustomerDashboard'>;

interface Props {
    navigation: CustomerDashboardScreenNavigationProp;
}

interface Product {
    id: string;
    name: string;
    price: number;
    stock: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

interface PurchaseHistoryItem {
    id: string;
    invoiceNo: string;
    date: string;
    items: number;
    amount: number;
}

interface PreOrder {
    id: string;
    products: Array<{ product: string; qty: number; price: number }>;
    subtotal?: number;
    discount?: number;
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'declined' | 'delivered';
    timestamp: string;
}

interface PreOrderProductItem {
    id: string;
    product: string;
    productName: string;
    qty: number;
    price: number;
    searchTerm: string;
}

const CustomerDashboard: React.FC<Props> = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('home');
    const [showLoyaltyAnimation, setShowLoyaltyAnimation] = useState(false);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const [activeForm, setActiveForm] = useState<string | null>(null);
    const [preOrderProducts, setPreOrderProducts] = useState<PreOrderProductItem[]>([
        { id: '1', product: '', productName: '', qty: 0, price: 0, searchTerm: '' }
    ]);
    const [dailySaleSearch, setDailySaleSearch] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Mock data - replace with API calls
    const [products, setProducts] = useState<Product[]>([
        { id: '1', name: 'Amla Shampoo', price: 550, stock: 'In Stock' },
        { id: '2', name: 'Hand Wash Rose', price: 880, stock: 'In Stock' },
        { id: '3', name: 'Black Hena', price: 320, stock: 'Low Stock' },
        { id: '4', name: 'Nail Polish Remover', price: 420, stock: 'In Stock' },
        { id: '5', name: 'Aloe Vera Gel', price: 650, stock: 'In Stock' },
        { id: '6', name: 'Rose Water', price: 380, stock: 'Low Stock' },
    ]);

    const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([
        { id: '1', invoiceNo: 'INV-2025-001', date: '2025-10-15', items: 5, amount: 2450 },
        { id: '2', invoiceNo: 'INV-2025-002', date: '2025-10-08', items: 3, amount: 1580 },
        { id: '3', invoiceNo: 'INV-2025-003', date: '2025-10-01', items: 7, amount: 3200 },
    ]);

    const [preOrders, setPreOrders] = useState<PreOrder[]>([
        {
            id: 'PRE-001',
            products: [
                { product: 'Amla Shampoo', qty: 2, price: 550 },
                { product: 'Hand Wash Rose', qty: 1, price: 880 },
            ],
            subtotal: 1980,
            discount: 5,
            totalAmount: 1881,
            status: 'pending',
            timestamp: '2025-01-28T10:30:00',
        },
        {
            id: 'PRE-002',
            products: [
                { product: 'Black Hena', qty: 3, price: 320 },
            ],
            totalAmount: 960,
            status: 'confirmed',
            timestamp: '2025-01-27T14:20:00',
        },
    ]);

    const loyaltyStatus = {
        current: 'Silver',
        points: 2450,
        nextTier: 'Gold',
        pointsToNext: 550,
        discount: 5,
        creditLimit: 150000
    };

    const customerName = 'ABC Retail';

    const handleRefresh = async () => {
        setRefreshing(true);
        // Fetch fresh data
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
    };

    const handleDailySaleSubmit = () => {
        setActiveForm(null);
        setShowLoyaltyAnimation(true);
        setTimeout(() => setShowLoyaltyAnimation(false), 3000);
        Alert.alert('Success', 'Daily sale updated! +50 loyalty points earned.');
    };

    const addPreOrderProduct = () => {
        setPreOrderProducts([
            ...preOrderProducts,
            { id: Date.now().toString(), product: '', productName: '', qty: 0, price: 0, searchTerm: '' }
        ]);
    };

    const removePreOrderProduct = (id: string) => {
        if (preOrderProducts.length > 1) {
            setPreOrderProducts(preOrderProducts.filter(item => item.id !== id));
        }
    };

    const updatePreOrderProduct = (id: string, field: keyof PreOrderProductItem, value: any) => {
        setPreOrderProducts(prev =>
            prev.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const selectProduct = (id: string, productData: Product) => {
        setPreOrderProducts(prev =>
            prev.map(item =>
                item.id === id
                    ? {
                        ...item,
                        product: productData.name,
                        productName: productData.name,
                        price: productData.price,
                        searchTerm: '',
                    }
                    : item
            )
        );
    };

    const openPreOrderWithProduct = (productData: Product) => {
        setPreOrderProducts([
            {
                id: Date.now().toString(),
                product: productData.name,
                productName: productData.name,
                qty: 1,
                price: productData.price,
                searchTerm: '',
            }
        ]);
        setActiveForm('preorder');
    };

    const handleConfirmPreOrder = () => {
        // Validate
        const validProducts = preOrderProducts.filter(p => p.product && p.qty > 0);

        if (validProducts.length === 0) {
            Alert.alert('Error', 'Please add at least one product with quantity');
            return;
        }

        // Calculate subtotal
        const subtotal = validProducts.reduce((sum, p) => sum + (p.price * p.qty), 0);

        // Apply 5% discount
        const discount = 5;
        const totalAmount = Math.round(subtotal * 0.95);

        // Add to pre-orders
        const newPreOrder: PreOrder = {
            id: `PRE-${Date.now()}`,
            products: validProducts.map(p => ({
                product: p.product,
                qty: p.qty,
                price: p.price
            })),
            subtotal,
            discount,
            totalAmount,
            status: 'pending',
            timestamp: new Date().toISOString(),
        };

        setPreOrders(prev => [newPreOrder, ...prev]);

        // Close form and show success
        setActiveForm(null);
        setPreOrderProducts([{ id: '1', product: '', productName: '', qty: 0, price: 0, searchTerm: '' }]);
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 3000);

        Alert.alert('Success', 'Pre-order sent successfully with 5% discount!');
    };

    const getLoyaltyColor = () => {
        switch (loyaltyStatus.current) {
            case 'Blue': return { from: '#60A5FA', to: '#3B82F6' };
            case 'Bronze': return { from: '#F59E0B', to: '#D97706' };
            case 'Silver': return { from: '#9CA3AF', to: '#6B7280' };
            case 'Gold': return { from: '#FBBF24', to: '#D97706' };
            case 'Platinum': return { from: '#A78BFA', to: '#7C3AED' };
            default: return { from: '#60A5FA', to: '#3B82F6' };
        }
    };

    const getStatusColor = (status: PreOrder['status']) => {
        switch (status) {
            case 'pending': return { bg: '#FEF3C7', text: '#92400E', border: '#FBBF24' };
            case 'confirmed': return { bg: '#DBEAFE', text: '#1E40AF', border: '#60A5FA' };
            case 'declined': return { bg: '#FEE2E2', text: '#991B1B', border: '#F87171' };
            case 'delivered': return { bg: '#D1FAE5', text: '#065F46', border: '#34D399' };
            default: return { bg: '#FEF3C7', text: '#92400E', border: '#FBBF24' };
        }
    };

    const getStatusIcon = (status: PreOrder['status']) => {
        switch (status) {
            case 'pending': return Clock;
            case 'confirmed': return CheckCircle2;
            case 'declined': return X;
            case 'delivered': return Package;
            default: return Clock;
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

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>Dreamron</Text>
                        <Text style={styles.logoSubtitle}>A WORLD CLASS YOU</Text>
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.companyName}>Manjula DMS</Text>
                        <Text style={styles.roleText}>{customerName}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => setShowNotifications(true)}
                >
                    <Bell size={24} color="#FFFFFF" />
                    <View style={styles.notificationBadge} />
                </TouchableOpacity>
            </View>

            {/* Quick Info Cards */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Star size={16} color="#FFFFFF" />
                    <Text style={styles.statLabel}>Loyalty Points</Text>
                    <Text style={styles.statValue}>{loyaltyStatus.points.toLocaleString()}</Text>
                </View>
                <View style={styles.statCard}>
                    <Calendar size={16} color="#FFFFFF" />
                    <Text style={styles.statLabel}>Next Visit</Text>
                    <Text style={styles.statValue}>Oct 23</Text>
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
            {/* Alert Banner */}
            <View style={styles.alertBanner}>
                <Bell size={20} color="#1E40AF" />
                <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>Van Visit Tomorrow</Text>
                    <Text style={styles.alertMessage}>Your delivery van will visit on Oct 23, 2025</Text>
                </View>
            </View>

            {/* Available Products */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Available Products</Text>
                </View>
                <View style={styles.cardContent}>
                    {products.map(product => (
                        <View key={product.id} style={styles.productCard}>
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{product.name}</Text>
                                <Text style={styles.productPrice}>Rs {product.price}</Text>
                            </View>
                            <View style={styles.productActions}>
                                <View style={[
                                    styles.stockBadge,
                                    product.stock === 'In Stock' ? styles.stockIn :
                                        product.stock === 'Low Stock' ? styles.stockLow : styles.stockOut
                                ]}>
                                    <Text style={styles.stockText}>{product.stock}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.productButton}
                                    onPress={() => openPreOrderWithProduct(product)}
                                >
                                    <ShoppingCart size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Pre Orders Section */}
            {preOrders.length > 0 && (
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Package size={20} color="#1E3EA6" />
                        <Text style={styles.cardTitle}>My Pre-Orders</Text>
                    </View>
                    <View style={styles.cardContent}>
                        {preOrders.map((order) => {
                            const StatusIcon = getStatusIcon(order.status);
                            const statusColor = getStatusColor(order.status);

                            return (
                                <View key={order.id} style={styles.preOrderCard}>
                                    <View style={styles.preOrderHeader}>
                                        <View>
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
                                                <Text style={styles.productNameSmall}>
                                                    {product.product} x {product.qty}
                                                </Text>
                                                <Text style={styles.productPriceSmall}>
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
                                </View>
                            );
                        })}
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
                    {purchaseHistory.map((order) => (
                        <View key={order.id} style={styles.historyItem}>
                            <View style={styles.historyHeader}>
                                <Text style={styles.invoiceNo}>{order.invoiceNo}</Text>
                                <Text style={styles.orderAmount}>Rs {order.amount.toLocaleString()}</Text>
                            </View>
                            <View style={styles.historyDetails}>
                                <Text style={styles.orderDate}>{order.date}</Text>
                                <Text style={styles.orderItems}>{order.items} items</Text>
                            </View>
                        </View>
                    ))}
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
                            <Text style={styles.paymentAmount}>Rs 12,450</Text>
                        </View>
                        <View style={styles.paymentStat}>
                            <Text style={styles.paymentLabel}>Credit Limit</Text>
                            <Text style={styles.paymentLimit}>Rs {loyaltyStatus.creditLimit.toLocaleString()}</Text>
                        </View>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: '25%' }]} />
                        </View>
                        <Text style={styles.progressText}>25% of credit limit used</Text>
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
                    <View style={[styles.loyaltyBadge, { backgroundColor: getLoyaltyColor().from }]}>
                        <Award size={40} color="#FFFFFF" />
                    </View>

                    <Text style={styles.loyaltyTitle}>{loyaltyStatus.current} Status</Text>
                    <Text style={styles.loyaltyPoints}>{loyaltyStatus.points.toLocaleString()} Points</Text>

                    <View style={styles.loyaltyBenefits}>
                        <View style={styles.benefitItem}>
                            <Text style={styles.benefitLabel}>Current Discount</Text>
                            <Text style={styles.benefitValue}>{loyaltyStatus.discount}%</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Text style={styles.benefitLabel}>Credit Limit</Text>
                            <Text style={styles.benefitValue}>Rs {loyaltyStatus.creditLimit.toLocaleString()}</Text>
                        </View>
                    </View>

                    <View style={styles.nextTierCard}>
                        <Text style={styles.nextTierTitle}>Next Tier: {loyaltyStatus.nextTier}</Text>
                        <Text style={styles.nextTierText}>
                            {loyaltyStatus.pointsToNext} points needed
                        </Text>
                        <View style={styles.tierProgressBar}>
                            <View
                                style={[
                                    styles.tierProgressFill,
                                    { width: `${(loyaltyStatus.points / (loyaltyStatus.points + loyaltyStatus.pointsToNext)) * 100}%` }
                                ]}
                            />
                        </View>
                    </View>
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
                        <Text style={styles.avatarText}>AR</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Shop Name</Text>
                        <TextInput
                            style={styles.input}
                            value="ABC Retail"
                            editable={false}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Contact Person</Text>
                        <TextInput
                            style={styles.input}
                            value="Saman Perera"
                            editable={false}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Street</Text>
                        <TextInput
                            style={styles.input}
                            value="123 Main Street"
                            editable={false}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>City</Text>
                        <TextInput
                            style={styles.input}
                            value="Colombo"
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
                            value="abc@retail.lk"
                            editable={false}
                        />
                    </View>

                    <TouchableOpacity style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutButton} onPress={() => handleLogout()}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    const renderPreOrderModal = () => (
        <Modal
            visible={activeForm === 'preorder'}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
                setActiveForm(null);
                setPreOrderProducts([{ id: '1', product: '', productName: '', qty: 0, price: 0, searchTerm: '' }]);
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
                                p.name.toLowerCase().includes(item.searchTerm.toLowerCase())
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
                                                        key={p.id}
                                                        style={styles.productSuggestion}
                                                        onPress={() => selectProduct(item.id, p)}
                                                    >
                                                        <Text>{p.name} - Rs {p.price}</Text>
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

                        {preOrderProducts.some(p => p.product && p.qty > 0) && (
                            <View style={styles.orderSummary}>
                                <Text style={styles.summaryTitle}>Order Summary</Text>
                                <View style={styles.summaryRow}>
                                    <Text>Total Amount</Text>
                                    <Text style={styles.summaryAmount}>
                                        Rs {preOrderProducts.reduce((sum, p) => sum + (p.price * p.qty), 0).toLocaleString()}
                                    </Text>
                                </View>
                                <Text style={styles.discountNote}>
                                    * 5% discount will be applied at checkout
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPreOrder}>
                            <Text style={styles.confirmButtonText}>Confirm Pre-Order</Text>
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
                                        p.name.toLowerCase().includes(dailySaleSearch.toLowerCase())
                                    ).map(p => (
                                        <TouchableOpacity
                                            key={p.id}
                                            style={styles.productSuggestion}
                                            onPress={() => setDailySaleSearch(p.name)}
                                        >
                                            <Text>{p.name}</Text>
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

                        <TouchableOpacity style={styles.confirmButton} onPress={handleDailySaleSubmit}>
                            <Text style={styles.confirmButtonText}>Submit Sale</Text>
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
                        {[
                            { title: 'Van Visit Tomorrow', message: 'Your delivery van will visit on Oct 20, 2025', color: '#DBEAFE', time: '2 hours ago' },
                            { title: 'Pre-Order Confirmed', message: 'Your pre-order for 5 items has been confirmed', color: '#D1FAE5', time: '1 day ago' },
                            { title: 'Loyalty Points Earned', message: 'You earned 150 points from your recent purchase!', color: '#FCE7F3', time: '2 days ago' },
                            { title: 'Payment Reminder', message: 'Outstanding balance: Rs 12,450. Due date: Oct 30', color: '#FFEDD5', time: '3 days ago' },
                        ].map((notification, index) => (
                            <View key={index} style={[styles.notificationCard, { backgroundColor: notification.color }]}>
                                <View style={styles.notificationContent}>
                                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                                    <Text style={styles.notificationTime}>{notification.time}</Text>
                                </View>
                            </View>
                        ))}
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
                    <Text style={styles.successMessage}>Your pre-order has been sent to the sales representative</Text>
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
    quickActions: {
        flexDirection: 'row',
        gap: 12,
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
    },
    orderDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    orderItems: {
        fontSize: 12,
        color: '#6B7280',
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
    },
    editButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 16,
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
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
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
        fontSize: 18,
        color: '#1E3EA6',
        fontWeight: '600',
    },
    discountNote: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 8,
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
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 13,
        marginBottom: 8,
    },
    notificationTime: {
        fontSize: 11,
        color: '#6B7280',
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

export default CustomerDashboard;