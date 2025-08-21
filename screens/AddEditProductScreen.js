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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../contexts/AuthContext';
import { addProduct, updateProduct } from '../data/api';
import { COLORS } from '../utils/colors';
import { IMGBB_API_KEY } from '../config/imageHosting';
import {useNotification} from "../components/NotificationSystem";

export default function AddEditProductScreen({ navigation, route }) {
  const { user } = useAuth();
  const { product } = route.params || {};
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: '',
    description: '',
    store: user.id,
  });
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const { showModal, showSuccess, showError } = useNotification();


  useEffect(() => {
    if (isEditing && product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        price: product.price?.toString() || '',
        image: product.image || '',
        description: product.description || '',
        store: user.id,
      });
    }
  }, [isEditing, product]);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Product' : 'Add Product',
    });
  }, [navigation, isEditing]);

  // Function to detect if user is on mobile web
  const isMobileWeb = () => {
    if (Platform.OS !== 'web') return false;
    
    const userAgent = navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
  };

  // Handle photo capture for web mobile
  const handlePhoto = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file.');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showError('Image file is too large. Please select an image under 10MB.');
        return;
      }
      
      console.log('Camera photo captured:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Upload the captured image directly
      uploadImageFromFile(file);
    }
  };

  // Function to upload file directly (for handlePhoto and other file uploads)
  const uploadImageFromFile = async (file) => {
    // Check if ImgBB API key is configured
    if (IMGBB_API_KEY === 'YOUR_IMGBB_API_KEY_HERE') {
      showModal({
        title: 'ImgBB API Not Configured',
        message: 'Please configure your ImgBB API key in the code. Visit https://api.imgbb.com/ to get one.',
        type: 'warning',
        buttons: [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setShowImageModal(false)
          },
          {
            text: 'Use Local Image',
            onPress: () => {
              const localUrl = URL.createObjectURL(file);
              updateFormData('image', localUrl);
              setShowImageModal(false);
            }
          },
        ]
      });
      return;
    }

    try {
      setImageUploading(true);
      console.log('Starting image upload from camera/file:', file.name);
      
      // Convert file to base64
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]; // Remove data URL prefix
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log('File converted to base64, uploading to ImgBB...');

      // Upload to ImgBB
      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', base64Image);
      formData.append('name', `camera_product_${Date.now()}`);

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data && data.data.url) {
        console.log('Camera image uploaded successfully to ImgBB:', data.data.url);
        updateFormData('image', data.data.url);
        showSuccess('Image uploaded successfully!');
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('ImgBB upload error:', error);
      showError('Failed to upload image: ' + error.message);
      
      // Fallback to local URL
      const localUrl = URL.createObjectURL(file);
      updateFormData('image', localUrl);
      showError('Using local image as fallback.');
    } finally {
      setImageUploading(false);
      setShowImageModal(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        price: formData.price.toString(),
        image: formData.image.trim(),
        description: formData.description.trim(),
        store: formData.store,
      };

      if (isEditing) {
        await updateProduct( product._id, productData);
        showSuccess('Product updated successfully');
        setTimeout(function() {
          navigation.goBack()
        }, 1000);
      } else {
        await addProduct(productData);
        showSuccess('Product added successfully');
        setTimeout(function() {
          navigation.goBack()
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      showError('Failed to save product. Please try again.');
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

  const convertImageToBase64 = async (imageUri) => {
    if (Platform.OS === 'web') {
      // Web platform: Use fetch to get the blob, then FileReader to convert to base64
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // Remove data URL prefix
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        throw new Error(`Failed to convert image to base64 on web: ${error.message}`);
      }
    } else {
      // Mobile platforms: Use Expo FileSystem
      try {
        const base64Image = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return base64Image;
      } catch (error) {
        throw new Error(`Failed to convert image to base64 on mobile: ${error.message}`);
      }
    }
  };

  const uploadImageToImgBB = async (imageUri) => {
    // Check if ImgBB API key is configured
    if (IMGBB_API_KEY === 'YOUR_IMGBB_API_KEY_HERE') {
      showModal({
        title: 'ImgBB API Not Configured',
        message: 'Please configure your ImgBB API key in the code. Visit https://api.imgbb.com/ to get one.',
        type: 'warning',
        buttons: [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'OK',
            onPress: () => updateFormData('image', imageUri)
          },
        ]
      });
      return imageUri; // Return local URI as fallback
    }

    try {
      setImageUploading(true);

      // Convert image to base64 (platform-specific)
      const base64Image = await convertImageToBase64(imageUri);

      // Create form data for ImgBB API
      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', base64Image);
      formData.append('name', 'product_image');

      // Upload to ImgBB
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data && data.data.url) {
        console.log('Product image uploaded successfully to ImgBB:', data.data.url);
        return data.data.url; // Return ImgBB URL
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('ImgBB upload error:', error);
      showError('Failed to upload image to ImgBB: '+error.message+ '. Using local image instead.');
      return imageUri; // Return local URI as fallback
    } finally {
      setImageUploading(false);
    }
  };

  const requestPermissions = async () => {
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (mediaLibraryStatus !== 'granted' || cameraStatus !== 'granted') {
      showError('Please grant camera and photo library permissions to add product images.');
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
        aspect: [1, 1], // Square aspect ratio for products
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localImageUri = result.assets[0].uri;
        
        // Upload image to ImgBB and get the URL
        const imgbbUrl = await uploadImageToImgBB(localImageUri);
        
        // Store the ImgBB URL (or local URI as fallback) in form data
        updateFormData('image', imgbbUrl);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      showError('Failed to pick image from gallery');
    }
  };

  const takePhoto = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for products
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localImageUri = result.assets[0].uri;
        
        // Upload image to ImgBB and get the URL
        const imgbbUrl = await uploadImageToImgBB(localImageUri);
        
        // Store the ImgBB URL (or local URI as fallback) in form data
        updateFormData('image', imgbbUrl);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showError('Failed to take photo');
    }
  };

  const handleImagePicker = () => {
    // Handle image removal first if image exists
    if (formData.image) {
      if (Platform.OS !== 'web') {
        // Native platform - show alert with remove option
        const options = [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove Image',
            style: 'destructive',
            onPress: () => updateFormData('image', ''),
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
        Alert.alert(
            'Update Product Image',
            'Choose an option for your product image',
            options
        );
        return;
      } else {
        // Web platform - show confirmation
        const choice = window.confirm(
            "Do you want to remove the current image?"
        );
        if (choice) {
          updateFormData('image', '')
          return
        }
      }
    }

    if (Platform.OS !== 'web') {
      // Native platform - show alert with options
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
      Alert.alert(
          'Add Product Image',
          'Choose how you want to add your product image',
          options
      );
    } else {
      // Web platform - check if mobile or desktop
      if (isMobileWeb()) {
        // Mobile web - show modal
        setShowImageModal(true);
      } else {
        // Desktop web - direct gallery pick
        pickImageFromGallery();
      }
    }
  };

  return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Product Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                placeholder="Enter product name"
                maxLength={100}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Category *</Text>
              <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={formData.category}
                  onChangeText={(value) => updateFormData('category', value)}
                  placeholder="Enter product category"
                  maxLength={100}
              />
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>

            {/* Price */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price (Rs.) *</Text>
              <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  value={formData.price}
                  onChangeText={(value) => {
                    // allow only digits
                    let numericValue = value.replace(/[^0-9]/g, '');

                    // limit max 6 digits (999999)
                    if (numericValue.length > 6) {
                      numericValue = numericValue.slice(0, 6);
                    }

                    updateFormData('price', numericValue);
                  }}
                  placeholder="Enter price"
                  keyboardType="numeric"
                  maxLength={6}   // double safety: UI stops at 6 chars
              />
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            </View>

            {/* Product Image */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Image</Text>
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
                    <Image source={{ uri: formData.image }} style={styles.productImagePreview} />
                    <View style={styles.imageOverlay}>
                      <Text style={styles.imageOverlayText}>
                        {formData.image.includes('imgbb.com') ? 'Uploaded • Tap to change' : 'Tap to change'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>Image</Text>
                    <Text style={styles.imagePlaceholderText}>Tap to add product image</Text>
                  </View>
                )}
              </TouchableOpacity>
              {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
            </View>

            

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateFormData('description', value)}
                placeholder="Enter product description (optional)"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
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
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update Product' : 'Add Product'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Mobile Web Image Picker Modal */}
        <Modal
          visible={showImageModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImageModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Product Image</Text>
              <Text style={styles.modalSubtitle}>Choose how you want to add your product image</Text>
              
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => {
                  setShowImageModal(false);
                  pickImageFromGallery();
                }}
              >
                <Text style={styles.modalButtonText}>📁 Upload from Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => {
                  // Close modal first for better UX
                  setShowImageModal(false);
                  
                  // Create hidden file input for camera with slight delay
                  setTimeout(() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.capture = 'environment'; // Use rear camera
                    input.style.display = 'none';
                    
                    // Handle the photo selection
                    input.addEventListener('change', (event) => {
                      handlePhoto(event);
                      // Clean up the input element
                      document.body.removeChild(input);
                    });
                    
                    // Handle cancellation (when user closes camera without taking photo)
                    input.addEventListener('cancel', () => {
                      document.body.removeChild(input);
                    });
                    
                    document.body.appendChild(input);
                    input.click();
                  }, 100);
                }}
              >
                <Text style={styles.modalButtonText}>📷 Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowImageModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
    minHeight: 100,
    maxHeight: 150,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
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
    height: 160,
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
    height: 160,
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
  productImagePreview: {
    width: '100%',
    height: 160,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelButton: {
    backgroundColor: COLORS.borderLight,
    marginTop: 8,
  },
  modalCancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
