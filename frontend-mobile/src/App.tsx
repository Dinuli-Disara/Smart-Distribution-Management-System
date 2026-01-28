// src/App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import LoginScreen from './screens/auth/LoginScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/auth/ResetPasswordScreen';
import Dashboard from './screens/salesrep/Dashboard';
import CustomerDashboard from './screens/customer/Dashboard';
import { DEEP_LINKING_CONFIG } from './config/deeplinking';
import { RootStackParamList } from './navigation/types';

// Create the navigator with proper typing
const Stack = createNativeStackNavigator<RootStackParamList>();

// For development - get your local IP
const LOCAL_IP = '10.90.46.38'; // Change this to your actual IP
const DEV_LINK = `exp://${LOCAL_IP}:8081`;

const App = () => {
  // Initialize deep linking
  const linking = {
    prefixes: [
      ...DEEP_LINKING_CONFIG.prefixes,
      DEV_LINK, // Add development link
    ],
    config: DEEP_LINKING_CONFIG.config,
  };

  useEffect(() => {
    // Handle deep links when app is launched from a link
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('App opened from link:', initialUrl);
        handleDeepLink(initialUrl);
      }
    };

    handleInitialURL();

    // Listen for deep links when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Deep link received:', url);
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    console.log('Processing deep link:', url);

    // Parse the URL
    const parsed = Linking.parse(url);
    console.log('Parsed URL:', parsed);

    if (parsed.path === 'reset-password' && parsed.queryParams?.token) {
      console.log('Reset password token:', parsed.queryParams.token);
      // The NavigationContainer will handle navigation automatically
    }
  };

  return (
    <AuthProvider>
      <NavigationContainer
        linking={linking}
        fallback={<></>} // You can add a loading component here
      >
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: 'Reset Password' }}
          />
          <Stack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
            options={{ title: 'Set New Password' }}
          />
          <Stack.Screen
            name="SalesDashboard"
            component={Dashboard}
            options={{ title: 'Dashboard', headerShown: false }}
          />
          <Stack.Screen
            name="CustomerDashboard"
            component={CustomerDashboard}
            options={{ title: 'Dashboard', headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;