import React, { createContext, useContext, useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';

const PermissionsContext = createContext({});

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissions, setPermissions] = useState({
    camera: false,
    mediaLibrary: false,
    location: false,
  });

  const checkAllPermissions = async () => {
    try {
      // Check camera permission
      const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
      
      // Check media library permission
      const mediaLibraryStatus = await MediaLibrary.getPermissionsAsync();
      
      // Check location permission
      const locationStatus = await Location.getForegroundPermissionsAsync();

      const newPermissions = {
        camera: cameraStatus.status === 'granted',
        mediaLibrary: mediaLibraryStatus.status === 'granted',
        location: locationStatus.status === 'granted',
      };

      setPermissions(newPermissions);
      
      const allGranted = newPermissions.camera && newPermissions.mediaLibrary && newPermissions.location;
      setPermissionsGranted(allGranted);
      setPermissionsChecked(true);
      
      return allGranted;
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissionsChecked(true);
      setPermissionsGranted(false);
      return false;
    }
  };

  const requestAllPermissions = async () => {
    try {
      // Request camera permission
      const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
      
      // Request media library permission
      const mediaLibraryResult = await MediaLibrary.requestPermissionsAsync();
      
      // Request location permission
      const locationResult = await Location.requestForegroundPermissionsAsync();

      const newPermissions = {
        camera: cameraResult.status === 'granted',
        mediaLibrary: mediaLibraryResult.status === 'granted',
        location: locationResult.status === 'granted',
      };

      setPermissions(newPermissions);
      
      const allGranted = newPermissions.camera && newPermissions.mediaLibrary && newPermissions.location;
      setPermissionsGranted(allGranted);
      
      return allGranted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const resetPermissionsCheck = () => {
    setPermissionsChecked(false);
    setPermissionsGranted(false);
  };

  // Check permissions on provider mount
  useEffect(() => {
    checkAllPermissions();
  }, []);

  const value = {
    permissionsChecked,
    permissionsGranted,
    permissions,
    checkAllPermissions,
    requestAllPermissions,
    resetPermissionsCheck,
    setPermissionsGranted,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

