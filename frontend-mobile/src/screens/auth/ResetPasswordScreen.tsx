// frontend-mobile/src/screens/auth/ResetPasswordScreen.tsx
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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import authService from '../../services/authService';

// Use NativeStackScreenProps for proper typing
type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

const ResetPasswordScreen: React.FC<Props> = ({ route, navigation }) => {
  // Get token from route params
  const { token } = route.params || {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid reset link');
        setVerifying(false);
        return;
      }

      try {
        const response = await authService.verifyResetToken(token);
        if (response.success) {
          setTokenValid(true);
        } else {
          setError('Invalid or expired reset link');
        }
      } catch (err: any) {
        setError('Failed to verify reset link');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async () => {
    setError('');

    if (!password || !confirmPassword) {
      setError('Please enter both password fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      if (!token) {
        setError('Invalid reset token');
        setLoading(false);
        return;
      }

      const response = await authService.resetPassword(token, password);
      
      if (response.success) {
        setSuccess(true);
        // Show success message and auto-navigate
        setTimeout(() => {
          navigation.replace('Login');
        }, 3000);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const handleRequestNewLink = () => {
    navigation.navigate('ForgotPassword');
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
                  onError={() => console.log('Failed to load logo')}
                />
                
                {/* Fallback Logo Text */}
                <View style={styles.fallbackLogo}>
                  <Text style={styles.fallbackLogoText}>Dreamron</Text>
                  <Text style={styles.fallbackSubtitle}>A WORLD CLASS YOU</Text>
                </View>

                <Text style={styles.title}>Set New Password</Text>
                <Text style={styles.subtitle}>Create a new password for your account</Text>
              </View>

              {/* Form Section */}
              <View style={styles.formSection}>
                {verifying ? (
                  <View style={styles.verifyingContainer}>
                    <ActivityIndicator size="large" color="#1E3EA6" />
                    <Text style={styles.verifyingText}>Verifying reset link...</Text>
                  </View>
                ) : !tokenValid ? (
                  <View style={styles.invalidTokenContainer}>
                    <View style={styles.errorBox}>
                      <Text style={styles.errorTitle}>{error}</Text>
                      <Text style={styles.errorDescription}>
                        The reset link may have expired or is invalid.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.newLinkButton}
                      onPress={handleRequestNewLink}
                    >
                      <Text style={styles.newLinkText}>Request a new reset link</Text>
                    </TouchableOpacity>
                  </View>
                ) : success ? (
                  <View style={styles.successContainer}>
                    <View style={styles.successMessage}>
                      <Text style={styles.successIcon}>✅</Text>
                      <Text style={styles.successText}>
                        Password reset successful! Redirecting to login page...
                      </Text>
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

                    {/* New Password Field */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>New Password</Text>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>🔒</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter new password"
                          placeholderTextColor="#9CA3AF"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry
                          editable={!loading}
                        />
                      </View>
                      <Text style={styles.hintText}>Must be at least 6 characters long</Text>
                    </View>

                    {/* Confirm Password Field */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Confirm New Password</Text>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>🔒</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Confirm new password"
                          placeholderTextColor="#9CA3AF"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry
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
                          <Text style={styles.submitButtonText}>Resetting...</Text>
                        </View>
                      ) : (
                        <Text style={styles.submitButtonText}>Reset Password</Text>
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
  verifyingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  verifyingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  invalidTokenContainer: {
    gap: 20,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
  },
  errorTitle: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  errorDescription: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 8,
  },
  newLinkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  newLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DB2777',
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
  successIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  successText: {
    color: '#065F46',
    fontSize: 14,
    flex: 1,
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
  hintText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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

export default ResetPasswordScreen;