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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../contexts/AuthContext';
import { addProduct, updateProduct } from '../data/api';
import { COLORS } from '../utils/colors';
import { IMGBB_API_KEY } from '../config/imageHosting';

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
        await updateProduct(user.storeId, product._id, productData);
        Alert.alert('Success', 'Product updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addProduct(productData);
        Alert.alert('Success', 'Product added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
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

  const uploadImageToImgBB = async (imageUri) => {
    // Check if ImgBB API key is configured
    if (IMGBB_API_KEY === 'YOUR_IMGBB_API_KEY_HERE') {
      Alert.alert(
        'ImgBB API Not Configured',
        'Please configure your ImgBB API key in the code. Visit https://api.imgbb.com/ to get one.',
        [
          { text: 'OK', onPress: () => updateFormData('image', imageUri) }
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
        'Please grant camera and photo library permissions to add product images.'
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
        onPress: () => updateFormData('image', ''),
      });
    }

    Alert.alert(
      formData.image ? 'Update Product Image' : 'Add Product Image',
      formData.image ? 'Choose an option for your product image' : 'Choose how you want to add your product image',
      options
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
                onChangeText={(value) => updateFormData('price', value)}
                placeholder="Enter price"
                keyboardType="numeric"
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
                    <Text style={styles.imagePlaceholderText}>📷</Text>
                    <Text style={styles.imagePlaceholderText}>Tap to add product image</Text>
                    <Text style={styles.imagePlaceholderSubtext}>Will be uploaded to ImgBB</Text>
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
});
