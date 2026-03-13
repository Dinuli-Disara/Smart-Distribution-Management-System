import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import Dashboard from '../screens/salesrep/Dashboard';
import CustomerDashboard from '../screens/customer/Dashboard';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {!user ? (
        // Auth screens
        <Stack.Group screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Group>
      ) : (
        // App screens based on role
        <Stack.Group>
          {user.role === 'customer' && (
            <Stack.Screen 
              name="CustomerDashboard" 
              component={CustomerDashboard}
              options={{ title: 'Customer Dashboard' }}
            />
          )}
          {user.role === 'Sales Representative' && (
            <Stack.Screen 
              name="SalesDashboard" 
              component={Dashboard}
              options={{ title: 'Sales Dashboard' }}
            />
          )}
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;