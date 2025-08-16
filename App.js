import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PermissionsProvider, usePermissions } from './contexts/PermissionsContext';
import LoginScreen from './screens/LoginScreen';
import StoreRegistrationScreen from './screens/StoreRegistrationScreen';
import DashboardScreen from './screens/DashboardScreen';
import ProductListScreen from './screens/ProductListScreen';
import AddEditProductScreen from './screens/AddEditProductScreen';
import EditStoreScreen from './screens/EditStoreScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import { COLORS } from './utils/colors';
import {Platform} from "react-native";

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="StoreRegistration" component={StoreRegistrationScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.appBackground,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProductList" 
        component={ProductListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddProduct" 
        component={AddEditProductScreen}
        options={{ title: 'Add Product' }}
      />
      <Stack.Screen 
        name="EditProduct" 
        component={AddEditProductScreen}
        options={{ title: 'Edit Product' }}
      />
      <Stack.Screen 
        name="EditStore" 
        component={EditStoreScreen}
        options={{ title: 'Edit Store Details' }}
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const { permissionsChecked, permissionsGranted, setPermissionsGranted } = usePermissions();

  // Show loading while checking auth or permissions
  if (loading || !permissionsChecked) {
    return null; // You can add a loading screen here
  }

  // Show permissions screen if permissions are not granted
  if (!permissionsGranted && Platform.OS !== 'web') {
    return (
      <NavigationContainer>
        <PermissionsScreen 
          onPermissionsGranted={() => setPermissionsGranted(true)} 
        />
      </NavigationContainer>
    );
  }

  // Show main app navigation once permissions are granted
  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={COLORS.appBackground} />
      <PermissionsProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </PermissionsProvider>
    </SafeAreaProvider>
  );
}
