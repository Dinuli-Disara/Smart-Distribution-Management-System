// frontend-mobile/src/screens/auth/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import authService from '../../services/authService';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
}

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        setSuccess(true);
        // Removed the Alert.alert here - only showing UI message
      } else {
        setError(response.message || 'Failed to send reset email');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  const handleResetForm = () => {
    // Reset form to send another email
    setEmail('');
    setSuccess(false);
    setError('');
  };

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
              source={require('../../assets/background.jpg')} 
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
                  source={require('../../assets/logo.png')} 
                  style={styles.logo}
                  resizeMode="contain"
                    onError={() => console.log('Failed to load logo image')}
                />

                <Text style={styles.title}>Reset Your Password</Text>
                <Text style={styles.subtitle}>Enter your email to receive a reset link</Text>
              </View>


              {/* Form Section */}
              <View style={styles.formSection}>
                {success ? (
                  <View style={styles.successContainer}>
                    {/* Success Message */}
                    <View style={styles.successMessage}>
                      <View style={styles.successIconContainer}>
                        <Text style={styles.successIcon}>✓</Text>
                      </View>
                      <Text style={styles.successText}>
                        Reset link sent successfully! Check your email for instructions to reset your password.
                      </Text>
                    </View>
                    
                    {/* Additional Info */}
                    <View style={styles.infoBox}>
                      <Text style={styles.infoTitle}>Didn't receive the email?</Text>
                      <View style={styles.infoList}>
                        <Text style={styles.infoItem}>• Check your spam or junk folder</Text>
                        <Text style={styles.infoItem}>• Verify you entered the correct email address</Text>
                        <Text style={styles.infoItem}>• Wait a few minutes and try again</Text>
                        <Text style={styles.infoItem}>• Or try sending again with the button below</Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.successActions}>
                      <TouchableOpacity
                        style={styles.tryAgainButton}
                        onPress={handleResetForm}
                      >
                        <Text style={styles.tryAgainButtonText}>Send Another Email</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBackToLogin}
                      >
                        <Text style={styles.backButtonText}>Back to Login</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.formContainer}>
                    {/* Error Message */}
                    {error ? (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    ) : null}

                    {/* Instructions */}
                    <Text style={styles.instructions}>
                      Enter the email address associated with your account and we'll send you a link to reset your password.
                    </Text>

                    {/* Email Field */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Email Address</Text>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>✉️</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your email address"
                          placeholderTextColor="#9CA3AF"
                          value={email}
                          onChangeText={setEmail}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="email-address"
                          editable={!loading}
                        />
                      </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                      onPress={handleSubmit}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator color="#FFFFFF" size="small" />
                          <Text style={styles.submitButtonText}>Sending...</Text>
                        </View>
                      ) : (
                        <Text style={styles.submitButtonText}>Send Reset Link</Text>
                      )}
                    </TouchableOpacity>

                    {/* Back to Login Link */}
                    <TouchableOpacity
                      style={styles.backLinkContainer}
                      onPress={handleBackToLogin}
                      disabled={loading}
                    >
                      <Text style={styles.backLinkText}>← Back to Login</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3EA6',
  },
  logoSubtitle: {
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
  successContainer: {
    gap: 20,
  },
  successMessage: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  successIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  successIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  successText: {
    color: '#065F46',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoList: {
    gap: 6,
  },
  infoItem: {
    color: '#1E40AF',
    fontSize: 13,
    lineHeight: 18,
  },
  successActions: {
    gap: 12,
  },
  tryAgainButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1E3EA6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryAgainButtonText: {
    color: '#1E3EA6',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#1E3EA6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    gap: 20,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
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
  instructions: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
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
  submitButton: {
    backgroundColor: '#1E3EA6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backLinkContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DB2777',
  },
});

export default ForgotPasswordScreen;