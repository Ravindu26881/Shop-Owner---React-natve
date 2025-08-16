import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import { COLORS } from '../utils/colors';

export default function PermissionsScreen({ onPermissionsGranted }) {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState({
    camera: false,
    mediaLibrary: false,
    location: false,
  });
  const [cameraPermissions, setCameraPermissions] = useState({});
  const [storagePermissions, setStoragePermissions] = useState({});
  const [locationPermissions, setLocationPermissions] = useState({});


  const checkPermissions = async () => {
    try {
      const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermissions(cameraResult)

      const mediaLibraryResult = await MediaLibrary.requestPermissionsAsync();
      setStoragePermissions(mediaLibraryResult)

      const locationResult = await Location.requestForegroundPermissionsAsync();
      setLocationPermissions(locationResult)

    } catch (error) {
      console.error('Error checking permissions:', error);
      return permissions;
    }
  };

  const requestCameraPermissions = async () => {
    const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermissions(cameraResult)
    if (cameraResult.granted === false && cameraResult.canAskAgain === true) {
        Alert.alert(
            'Camera Permission Required',
            'This app requires camera access to take photos of your products. Please enable camera access in your device settings.',
            [{ text: 'OK', onPress: () => {} }]
        );
      const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermissions(cameraResult)
    } else if (cameraResult.granted === false && cameraResult.canAskAgain === false) {
        Alert.alert(
            'Camera Permission Denied',
            'You have denied camera access. Please enable it in your device settings to use this feature.',
            [{
              text: 'OK',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              } }]
        );
    }
    console.log('camera permissions result: ', cameraResult);
  }

  const requestStoragePermissions = async () => {
    const mediaLibraryResult = await MediaLibrary.requestPermissionsAsync();
    setStoragePermissions(mediaLibraryResult)
    if (mediaLibraryResult.granted === false && mediaLibraryResult.canAskAgain === true) {
      Alert.alert(
          'Storage Permission Required',
          'This app requires storage access to upload photos of your products. Please enable storage access in your device settings.',
          [{ text: 'OK', onPress: () => {} }]
      );
      const mediaLibraryResult = await MediaLibrary.requestPermissionsAsync();
      setStoragePermissions(mediaLibraryResult)
    } else if (mediaLibraryResult.granted === false && mediaLibraryResult.canAskAgain === false) {
      Alert.alert(
          'Storage Permission Denied',
          'You have denied storage access. Please enable it in your device settings to use this feature.',
          [{
            text: 'OK',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            } }]
      );
    }
    console.log('storage permissions result: ', mediaLibraryResult);
  }

  const requestLocationPermissions = async () => {
    const locationResult = await Location.requestForegroundPermissionsAsync();
    setLocationPermissions(locationResult)
    if (locationResult.granted === false && locationResult.canAskAgain === true) {
      Alert.alert(
          'Location Permission Required',
          'This app requires location access to save your store location. Please enable location access in your device settings.',
          [{ text: 'OK', onPress: () => {} }]
      );
      const locationResult = await Location.requestForegroundPermissionsAsync();
      setLocationPermissions(locationResult)
    } else if (locationResult.granted === false && locationResult.canAskAgain === false) {
      Alert.alert(
          'Location Permission Denied',
          'You have denied location access. Please enable it in your device settings to use this feature.',
          [{
            text: 'OK',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            } }]
      );
    }
    console.log('location permissions result: ', locationResult);
  }

  // Check permissions on component mount
  React.useEffect(() => {
    checkPermissions();
  }, []);



  const PermissionItem = ({ icon, title, description, granted }) => (
    <View style={styles.permissionItem}>
      <View style={styles.permissionIcon}>
        <Text style={styles.permissionIconText}>{icon}</Text>
      </View>
      <View style={styles.permissionContent}>
        <Text style={styles.permissionTitle}>{title}</Text>
        <Text style={styles.permissionDescription}>{description}</Text>
      </View>
      <View style={[styles.permissionStatus, granted && styles.permissionStatusGranted]}>
        <Text style={[styles.permissionStatusText, granted && styles.permissionStatusTextGranted]}>
          {granted ? '✓' : '✗'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Bazario Console</Text>
          <Text style={styles.subtitle}>
            To provide the best experience, we need access to a few device features
          </Text>
        </View>

        <View style={styles.permissionsContainer}>
          <TouchableOpacity
              onPress={requestCameraPermissions}
              disabled={loading}
          >
            <PermissionItem
              icon="📷"
              title="Camera Access"
              description="Take photos of your products for listings"

              granted={cameraPermissions.granted}
            />
          </TouchableOpacity>
          <TouchableOpacity
              onPress={requestStoragePermissions}
              disabled={loading}
          >
            <PermissionItem
              icon="📱"
              title="Photo Library Access"
              description="Select existing photos from your gallery"
              granted={storagePermissions.granted}
            />
          </TouchableOpacity>
          <TouchableOpacity
              onPress={requestLocationPermissions}
              disabled={loading}
          >
            <PermissionItem
              icon="📍"
              title="Location Access"
              description="Help customers find your store location"
              granted={locationPermissions.granted}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          {storagePermissions.granted=== true && cameraPermissions.granted===true && locationPermissions.granted===true ? (
              <TouchableOpacity
                  style={styles.checkButton}
                  onPress={checkPermissions}
                  disabled={true}
              >
                <Text style={styles.checkButtonText}>
                  Proceed
                </Text>
              </TouchableOpacity>
          ) : ''}


          <Text style={styles.footerNote}>
            These permissions are essential for core app functionality. You can manage permissions in your device settings.
          </Text>
          <Text style={styles.footerNoteContact}>
            Need any help? Contact us at 0774462717
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  permissionsContainer: {
    flex: 1,
    marginTop: 40,
    marginBottom: 40,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  permissionIcon: {
    width: 30,
    height: 50,
    borderRadius: 25,
    // backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  permissionIconText: {
    fontSize: 24,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  permissionStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 5,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionStatusGranted: {
    backgroundColor: COLORS.success,
  },
  permissionStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  permissionStatusTextGranted: {
    color: COLORS.white,
  },
  footer: {
    paddingBottom: 20,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionButtonDisabled: {
    opacity: 0.6,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  checkButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  checkButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  footerNoteContact: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
    marginTop: 8,
  }
});

