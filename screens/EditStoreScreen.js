import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { updateStore, fetchStoreById, verifyPassword } from '../data/api';
import { COLORS } from '../utils/colors';
import { IMGBB_API_KEY } from '../config/imageHosting';

export default function EditStoreScreen({ navigation }) {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    owner: '',
    username: '',
    password: '',
    image: '',
    category: '',
    isActive: true,
    locationLat: '',
    locationLng: '',
  });
  const [errors, setErrors] = useState({});
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showCurrentPasswordPrompt, setShowCurrentPasswordPrompt] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState('');

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    try {
      if (user?.id) {
        const storeData = await fetchStoreById(user.id);
        const initialData = {
          name: storeData.name || '',
          description: storeData.description || '',
          address: storeData.address || '',
          phone: storeData.phone || '',
          email: storeData.email || '',
          owner: storeData.owner || '',
          username: storeData.username || '',
          password: '', // Don't load the password for security
          image: storeData.image || '',
          category: storeData.category || '',
          isActive: storeData.isActive !== undefined ? storeData.isActive : true,
          locationLat: storeData.locationLat || '',
          locationLng: storeData.locationLng || '',
        };
        setFormData(initialData);
        setOriginalData(initialData);
      }
    } catch (error) {
      console.error('Error loading store data:', error);
      Alert.alert('Error', 'Failed to load store data');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Store name is required';
    }

    if (!formData.owner.trim()) {
      newErrors.owner = 'Owner name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (showPasswordFields && !formData.password.trim()) {
      newErrors.password = 'Password is required when updating password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getChangedFields = () => {
    const changes = {};
    Object.keys(formData).forEach(key => {
      if (key === 'password' && !showPasswordFields) {
        return; // Don't include password if not changing it
      }
      if (formData[key] !== originalData[key]) {
        changes[key] = formData[key];
      }
    });
    return changes;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    const changes = getChangedFields();
    if (Object.keys(changes).length === 0) {
      Alert.alert('No Changes', 'No changes were made to save.');
      return;
    }

    setLoading(true);
    try {
      console.log('Saving changes:', changes);
      const updatedStore = await updateStore(user.id, changes);
      
      // Update the user data in AuthContext and AsyncStorage with the new data
      const updatedUser = { ...user, ...updatedStore };
      setUser(updatedUser);
      
      // Also update AsyncStorage for persistence
      await AsyncStorage.setItem('storeOwnerData', JSON.stringify(updatedUser));

      const title = 'Store Details Updated';
      const message = 'Your store details have been successfully updated.';
      if (Platform.OS !== 'web') {
        Alert.alert(title, message, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        window.alert(`${title}\n\n${message}`);
        navigation.goBack();
      }

    } catch (error) {
      console.error('Error updating store:', error);
      Alert.alert('Error', 'Failed to update store details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handlePasswordToggle = () => {
    if (showPasswordFields) {
      // If password fields are showing, hide them
      setShowPasswordFields(false);
      setShowCurrentPasswordPrompt(false);
      setCurrentPasswordInput('');
      setCurrentPasswordError('');
      updateFormData('password', '');
    } else {
      // If password fields are hidden, show current password prompt first
      setShowCurrentPasswordPrompt(true);
      setCurrentPasswordError('');
    }
  };

  const verifyCurrentPassword = async () => {
    if (!currentPasswordInput.trim()) {
      setCurrentPasswordError('Please enter your current password');
      return;
    }

    setVerifyingPassword(true);
    setCurrentPasswordError('');
    
    try {
      const response = await verifyPassword(user.username, currentPasswordInput);
      if (response.passwordMatches) {
        // Password verified, show new password fields
        setShowCurrentPasswordPrompt(false);
        setShowPasswordFields(true);
        setCurrentPasswordInput('');
        setCurrentPasswordError('');
      } else {
        setCurrentPasswordError('Current password is incorrect');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setCurrentPasswordError('Failed to verify current password. Please try again.');
    } finally {
      setVerifyingPassword(false);
    }
  };

  const cancelPasswordChange = () => {
    setShowCurrentPasswordPrompt(false);
    setCurrentPasswordInput('');
    setCurrentPasswordError('');
  };

  const uploadImageToImgBB = async (imageUri) => {
    if (IMGBB_API_KEY === 'YOUR_IMGBB_API_KEY_HERE') {
      Alert.alert(
        'ImgBB API Not Configured',
        'Please configure your ImgBB API key in the code. Visit https://api.imgbb.com/ to get one.',
        [{ text: 'OK', onPress: () => updateFormData('image', imageUri) }]
      );
      return imageUri;
    }

    try {
      setImageUploading(true);
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const formDataImg = new FormData();
      formDataImg.append('key', IMGBB_API_KEY);
      formDataImg.append('image', base64Image);
      formDataImg.append('name', 'store_image');

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formDataImg,
      });

      const data = await response.json();

      if (data.success && data.data && data.data.url) {
        return data.data.url;
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('ImgBB upload error:', error);
      Alert.alert(
        'Upload Failed',
        `Failed to upload image: ${error.message}\n\nUsing local image instead.`
      );
      return imageUri;
    } finally {
      setImageUploading(false);
    }
  };

  const handleImagePicker = () => {
    const options = [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose from Gallery', onPress: pickImageFromGallery },
      { text: 'Take Photo', onPress: takePhoto },
    ];

    if (formData.image) {
      options.splice(1, 0, {
        text: 'Remove Image',
        style: 'destructive',
        onPress: () => updateFormData('image', ''),
      });
    }

    Alert.alert(
      formData.image ? 'Update Store Image' : 'Add Store Image',
      'Choose an option for your store image',
      options
    );
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localImageUri = result.assets[0].uri;
        const imgbbUrl = await uploadImageToImgBB(localImageUri);
        updateFormData('image', imgbbUrl);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localImageUri = result.assets[0].uri;
        const imgbbUrl = await uploadImageToImgBB(localImageUri);
        updateFormData('image', imgbbUrl);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Store Status */}
            <View style={styles.inputGroup}>
              <View style={styles.switchContainer}>
                <Text style={styles.label}>Store Active Status</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => updateFormData('isActive', value)}
                  trackColor={{ false: COLORS.border, true: COLORS.success }}
                  thumbColor={formData.isActive ? COLORS.white : COLORS.textSecondary}
                />
              </View>
              <Text style={[styles.statusText, formData.isActive ? styles.statusActive : styles.statusInactive]}>
                {formData.isActive ? 'Store is currently active and visible to customers' : 'Store is currently inactive and hidden from customers'}
              </Text>
            </View>

            {/* Store Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Store Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                placeholder="Enter store name"
                maxLength={100}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Owner Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Owner Name *</Text>
              <TextInput
                style={[styles.input, errors.owner && styles.inputError]}
                value={formData.owner}
                onChangeText={(value) => updateFormData('owner', value)}
                placeholder="Enter owner name"
                maxLength={100}
              />
              {errors.owner && <Text style={styles.errorText}>{errors.owner}</Text>}
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username *</Text>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                value={formData.username}
                onChangeText={(value) => updateFormData('username', value)}
                placeholder="Enter username"
                maxLength={50}
                autoCapitalize="none"
              />
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Store Category *</Text>
              <TextInput
                style={[styles.input, errors.category && styles.inputError]}
                value={formData.category}
                onChangeText={(value) => updateFormData('category', value)}
                placeholder="Enter store category (e.g., Clothing, Electronics)"
                maxLength={50}
              />
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateFormData('description', value)}
                placeholder="Enter store description"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(value) => updateFormData('address', value)}
                placeholder="Enter store address"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                maxLength={200}
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={100}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Store Image */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Store Image</Text>
              <TouchableOpacity 
                style={[styles.imagePickerButton, imageUploading && styles.imagePickerDisabled]} 
                onPress={handleImagePicker}
                disabled={imageUploading}
              >
                {imageUploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                ) : formData.image ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: formData.image }} style={styles.storeImagePreview} />
                    <View style={styles.imageOverlay}>
                      <Text style={styles.imageOverlayText}>Tap to change</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>🏪</Text>
                    <Text style={styles.imagePlaceholderText}>Tap to add store image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Password Section */}
            <View style={styles.inputGroup}>
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={handlePasswordToggle}
              >
                <Text style={styles.passwordToggleText}>
                  {showPasswordFields ? '🔐 Hide Password Fields' : '🔓 Change Password'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Current Password Verification */}
            {showCurrentPasswordPrompt && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password *</Text>
                <TextInput
                  style={[styles.input, currentPasswordError && styles.inputError]}
                  value={currentPasswordInput}
                  onChangeText={(value) => {
                    setCurrentPasswordInput(value);
                    if (currentPasswordError) {
                      setCurrentPasswordError('');
                    }
                  }}
                  placeholder="Enter your current password"
                  secureTextEntry
                  maxLength={100}
                />
                {currentPasswordError ? (
                  <Text style={styles.errorText}>{currentPasswordError}</Text>
                ) : (
                  <Text style={styles.helpText}>Please verify your current password to change it</Text>
                )}
                
                <View style={styles.passwordButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.passwordButton, styles.passwordButtonCancel]}
                    onPress={cancelPasswordChange}
                  >
                    <Text style={styles.passwordButtonTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.passwordButton, styles.passwordButtonVerify, verifyingPassword && styles.passwordButtonDisabled]}
                    onPress={verifyCurrentPassword}
                    disabled={verifyingPassword}
                  >
                    {verifyingPassword ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={styles.passwordButtonTextVerify}>Verify</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* New Password Fields */}
            {showPasswordFields && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password *</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  placeholder="Enter new password"
                  secureTextEntry
                  maxLength={100}
                />
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                <Text style={styles.helpText}>Enter your new password</Text>
              </View>
            )}

            {/* Location Fields */}
            <View style={styles.locationContainer}>
              <Text style={styles.label}>Store Location (Optional)</Text>
              <View style={styles.locationRow}>
                <View style={styles.locationInput}>
                  <Text style={styles.locationLabel}>Latitude</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.locationLat}
                    onChangeText={(value) => updateFormData('locationLat', value)}
                    placeholder="7.8731"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.locationInput}>
                  <Text style={styles.locationLabel}>Longitude</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.locationLng}
                    onChangeText={(value) => updateFormData('locationLng', value)}
                    placeholder="80.7718"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <Text style={styles.helpText}>Use 'Save Your Current Location' from dashboard for automatic location</Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    minHeight: 80,
    maxHeight: 120,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
  },
  helpText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  statusActive: {
    color: COLORS.success,
  },
  statusInactive: {
    color: COLORS.error,
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  imagePickerDisabled: {
    opacity: 0.7,
    backgroundColor: COLORS.borderLight,
  },
  imagePlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.borderLight,
  },
  imagePlaceholderText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 4,
  },
  uploadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.borderLight,
  },
  uploadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  imageContainer: {
    position: 'relative',
  },
  storeImagePreview: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  imageOverlayText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  passwordToggle: {
    backgroundColor: COLORS.borderLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  passwordToggleText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  passwordButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  passwordButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  passwordButtonCancel: {
    backgroundColor: COLORS.border,
  },
  passwordButtonVerify: {
    backgroundColor: COLORS.primary,
  },
  passwordButtonDisabled: {
    opacity: 0.6,
  },
  passwordButtonTextCancel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  passwordButtonTextVerify: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  locationContainer: {
    marginBottom: 24,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  locationInput: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
