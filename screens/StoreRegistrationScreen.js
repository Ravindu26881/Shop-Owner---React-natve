import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { COLORS } from '../utils/colors';
import { IMGBB_API_KEY } from '../config/imageHosting';
import {saveStore} from "../data/api";

export default function StoreRegistrationScreen() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    owner: '',
    category: '',
    image: null,
    password: '',
    username: '',
  });
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const uploadImageToImgBB = async (imageUri) => {
    // Check if ImgBB API key is configured
    if (IMGBB_API_KEY === 'YOUR_IMGBB_API_KEY_HERE') {
      Alert.alert(
        'ImgBB API Not Configured',
        'Please configure your ImgBB API key in the code. Visit https://api.imgbb.com/ to get one.',
        [
          { text: 'OK', onPress: () => handleInputChange('image', imageUri) }
        ]
      );
      return imageUri; // Return local URI as fallback
    }

    try {
      setImageUploading(true);

      // Convert image to base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create form data for ImgBB API
      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', base64Image);
      formData.append('name', 'store_image');

      // Upload to ImgBB
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data && data.data.url) {
        console.log('Image uploaded successfully to ImgBB:', data.data.url);
        return data.data.url; // Return ImgBB URL
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('ImgBB upload error:', error);
      Alert.alert(
        'Upload Failed',
        `Failed to upload image to ImgBB: ${error.message}\n\nUsing local image instead.`,
        [
          { text: 'OK' }
        ]
      );
      return imageUri; // Return local URI as fallback
    } finally {
      setImageUploading(false);
    }
  };


  const requestPermissions = async () => {
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (mediaLibraryStatus !== 'granted' || cameraStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to add store images.'
      );
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 16],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localImageUri = result.assets[0].uri;
        
        // Upload image to ImgBB and get the URL
        const imgbbUrl = await uploadImageToImgBB(localImageUri);
        
        // Store the ImgBB URL (or local URI as fallback) in form data
        handleInputChange('image', imgbbUrl);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const takePhoto = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 16],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localImageUri = result.assets[0].uri;
        
        // Upload image to ImgBB and get the URL
        const imgbbUrl = await uploadImageToImgBB(localImageUri);
        
        // Store the ImgBB URL (or local URI as fallback) in form data
        handleInputChange('image', imgbbUrl);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleImagePicker = () => {
    const options = [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Choose from Gallery',
        onPress: pickImageFromGallery,
      },
      {
        text: 'Take Photo',
        onPress: takePhoto,
      },
    ];

    // Add remove option if image exists
    if (formData.image) {
      options.splice(1, 0, {
        text: 'Remove Image',
        style: 'destructive',
        onPress: () => handleInputChange('image', null),
      });
    }

    Alert.alert(
      formData.image ? 'Update Store Image' : 'Add Store Image',
      formData.image ? 'Choose an option for your store image' : 'Choose how you want to add your store image',
      options
    );
  };

  const validateForm = () => {
    const requiredFields = ['name', 'description', 'owner', 'category', 'password', 'username'];
    
    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        Alert.alert('Error', `Please enter ${field.replace('_', ' ')}`);
        return false;
      }
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await saveStore(formData)
      console.log('Store registration data:', formData);

      
      Alert.alert(
        'Success',
        'Store registration submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to register store. Please try again.');
      console.error('Store registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Register Your Store</Text>
              <Text style={styles.subtitle}>Fill in the details to register your store</Text>
            </View>

            <View style={styles.form}>
              {/* Store Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Store Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="Enter your store name"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Store Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Store Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  placeholder="Describe your store"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Owner Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Owner Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.owner}
                  onChangeText={(value) => handleInputChange('owner', value)}
                  placeholder="Enter owner's name"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.category}
                  onChangeText={(value) => handleInputChange('category', value)}
                  placeholder="e.g., Electronics, Clothing, Food"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
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
                      <Text style={styles.uploadingText}>Uploading to ImgBB...</Text>
                    </View>
                  ) : formData.image ? (
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: formData.image }} style={styles.imagePreview} />
                      <View style={styles.imageOverlay}>
                        <Text style={styles.imageOverlayText}>
                          {formData.image.includes('imgbb.com') ? 'Uploaded • Tap to change' : 'Tap to change'}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.imagePlaceholderText}>📷</Text>
                      <Text style={styles.imagePlaceholderText}>Tap to add store image</Text>
                      <Text style={styles.imagePlaceholderSubtext}>Will be uploaded to ImgBB</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.username}
                  onChangeText={(value) => handleInputChange('username', value)}
                  placeholder="Enter username"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    placeholder="Enter password (min. 6 characters)"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.passwordToggleText}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Register Store</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
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
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 60,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 14,
    paddingVertical: 4,
  },
  passwordToggleText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
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
  imagePlaceholderSubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
    opacity: 0.7,
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
  imagePreview: {
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
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
