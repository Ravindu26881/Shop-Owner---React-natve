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
import {Platform, TouchableOpacity, Text} from "react-native";

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.appBackground,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
        headerShadowVisible: false,
        gestureEnabled: true,
        headerLeftContainerStyle: {
          paddingLeft: 10,
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          title: 'Login',
          headerLeft: () => null, // No back button on login
        }}
      />
      <Stack.Screen 
        name="StoreRegistration" 
        component={StoreRegistrationScreen}
        options={{ title: 'Store Registration' }}
      />
    </Stack.Navigator>
  );
}

function AppStack() {
  const { logout, user } = useAuth();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
          borderBottomColor: COLORS.border,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
          headerBackTitleVisible: false,
        headerShadowVisible: false,
        gestureEnabled: true,
        headerLeftContainerStyle: {
          paddingLeft: 10,
        },
        headerRightContainerStyle: {
          paddingRight: 15,
        },
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
        options={({ navigation }) => ({
          title: 'Products',
        })}
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
        options={{ title: 'Store Settings' }}
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
