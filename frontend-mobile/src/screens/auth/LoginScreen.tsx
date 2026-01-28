// frontend-mobile/src/screens/auth/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
//import "../../assets/background.jpg";

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('Login Screen MOUNTED');
    return () => {
      console.log('Login Screen UNMOUNTED');
    };
  }, []);

  useEffect(() => {
    console.log('Error state changed:', error);
  }, [error]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = async () => {
    console.log('Form submitted');
    setError('');
    setIsSubmitting(true);

    if (!formData.username || !formData.password) {
      console.log('Validation error: missing fields');
      setError('Please enter both username and password');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Attempting login with username:', formData.username);
      const result = await login(formData.username, formData.password);
      console.log('Login result:', result);

      if (result.success) {
        const role = result.data?.role;
        console.log('Login successful, role:', role);

        // Navigate based on role (you'll need to set up your navigation stack)
        if (role === 'Sales Representative') {
          navigation.replace('SalesDashboard');
        } else if (role === 'customer' || role === 'Customer') {
          // Handle both lowercase and capitalized role
          navigation.replace('CustomerDashboard');
        } else {
          // Default dashboard if role doesn't match
          navigation.replace('MainDashboard');
        }
      } else {
        console.log('Login failed with error:', result.message);
        setError(result.message || 'Login failed');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const loading = authLoading || isSubmitting;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Background Image with Overlay */}
          <View style={styles.backgroundContainer}>
            <Image
              source={require('../../assets/background.jpg')} // Make sure this image exists
              style={styles.backgroundImage}
              resizeMode="cover"
              onError={() => console.log('Failed to load background image')}
            />
            <View style={styles.overlay} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.card}>
              {/* Logo Section */}
              <View style={styles.logoSection}>
                <Image
                  source={require('../../assets/logo.png')} // Make sure this image exists
                  style={styles.logo}
                  resizeMode="contain"
                  onError={() => console.log('Failed to load logo')}
                />

                <Text style={styles.title}>Manjula Marketing DMS</Text>
                <Text style={styles.subtitle}>Smart Distribution. Smarter Growth.</Text>
              </View>

              {/* Form Section */}
              <View style={styles.formSection}>
                {/* Error Message */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}></Text>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Username Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Username</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}></Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your username"
                      placeholderTextColor="#9CA3AF"
                      value={formData.username}
                      onChangeText={(value) => handleChange('username', value)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}></Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      value={formData.password}
                      onChangeText={(value) => handleChange('password', value)}
                      secureTextEntry
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity
                  style={styles.forgotPasswordContainer}
                  onPress={handleForgotPassword}
                  disabled={loading}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.loginButtonText}>Signing in...</Text>
                    </View>
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 62, 166, 1)',
    opacity: 0.65,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  logoSection: {
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  logo: {
    height: 64,
    width: 150,
    marginBottom: 16,
  },
  fallbackLogo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  fallbackLogoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3EA6',
  },
  fallbackSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  formSection: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    color: '#111827',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DB2777',
  },
  loginButton: {
    backgroundColor: '#1E3EA6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;