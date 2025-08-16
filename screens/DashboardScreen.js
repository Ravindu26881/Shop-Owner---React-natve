import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import {fetchProductsByStoreId, saveStoreLocation} from '../data/api';
import { COLORS } from '../utils/colors';
import {useFocusEffect} from "@react-navigation/native";
import * as Location from 'expo-location';
import { useGeolocated } from 'react-geolocated';


// Platform-specific alert function
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    // Web: Use window.alert with title and message combined
    window.alert(`${title}\n\n${message}`);
  } else {
    // Mobile: Use React Native Alert
    Alert.alert(title, message);
  }
};

export async function getCurrentPosition() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission not granted');
  // HighAccuracy uses GPS; you can set accuracy to Balanced if you want less battery usage
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Use geolocated hook only on web
  const geoData = Platform.OS === 'web' ? useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
      maximumAge: 60000,
      timeout: 10000,
    },
    watchPosition: false,
    userDecisionTimeout: 5000,
  }) : {
    coords: null,
    isGeolocationAvailable: false,
    isGeolocationEnabled: false,
    positionError: null
  };

  const { coords, isGeolocationAvailable, isGeolocationEnabled, positionError } = geoData;

  useFocusEffect(
      useCallback(() => {
        loadDashboardData();
      }, [user?.id])
  );

  const saveLocation = async () => {
    try {
      if (Platform.OS !== 'web') {
        // Mobile platform
        const loc = await getCurrentPosition();
        // const loc = {"lat": 7.0022624, "lng": 80.0076049}
        const response = await saveStoreLocation(user.id, loc["lng"], loc["lat"]);
        console.log('saveLocation', loc.lng);
        showAlert('Success', 'Your store location has been saved successfully!');
      } else {
        // Web platform using react-geolocated
        if (!isGeolocationAvailable) {
          showAlert('Error', 'Geolocation is not supported by this browser.');
          return;
        }

        if (!isGeolocationEnabled) {
          showAlert('Error', 'Geolocation is not enabled. Please enable location services.');
          return;
        }

        if (positionError) {
          let errorMessage = 'Failed to get location. ';
          
          if (positionError.code === 1) {
            errorMessage += 'Location access was denied. Please enable location permissions and try again.';
          } else if (positionError.code === 2) {
            errorMessage += 'Location information is unavailable.';
          } else if (positionError.code === 3) {
            errorMessage += 'Location request timed out.';
          } else {
            errorMessage += 'Please try again.';
          }
          
          showAlert('Location Error', errorMessage);
          return;
        }

        if (!coords) {
          showAlert('Error', 'Location data is not available yet. Please try again in a moment.');
          return;
        }

        const loc = {
          lat: coords.latitude,
          lng: coords.longitude
        };

        console.log("Lat:", loc.lat, "Lng:", loc.lng);
        
        // Save location to server
        const response = await saveStoreLocation(user.id, loc.lng, loc.lat);
        showAlert('Success', 'Your store location has been saved successfully!');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      showAlert('Location Error', 'Failed to save location. Please try again.');
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const products = await fetchProductsByStoreId(user.id);
        setProductCount(products.length);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout()
  };

  const menuItems = [
    {
      title: 'Manage Products',
      subtitle: `${productCount} products`,
      icon: '📦',
      onPress: () => navigation.navigate('ProductList'),
      color: COLORS.primary,
    },
    {
      title: 'Add New Product',
      subtitle: 'Create a new product',
      icon: '➕',
      onPress: () => navigation.navigate('AddProduct'),
      color: COLORS.success,
    },
    {
      title: 'Save Your Current Location',
      subtitle: 'So nearby customers can find you',
      icon: '➕',
      onPress: saveLocation,
      color: COLORS.success,
    },
    {
      title: 'Store Settings',
      subtitle: 'Manage store details',
      icon: '⚙️',
      onPress: () => navigation.navigate('EditStore'),
      color: COLORS.warning,
    },
  ];

  if (loading) {
    return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </View>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Welcome Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.storeName}>{user?.owner || 'Store Owner'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{productCount}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Text style={styles.menuIconText}>{item.icon}</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24
  },
  logoutText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  menuContainer: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuIconText: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  menuArrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
});

export default DashboardScreen;
