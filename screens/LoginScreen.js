import React, {useEffect, useState} from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/colors';
import {fetchStoreByUserName, verifyPassword} from '../data/api';

export default function LoginScreen() {
  const [storeName, setStoreName] = useState('');
  const [storeOwnerName, setStoreOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('username'); // 'username' or 'password'
  const { login, userCheck } = useAuth();
  const navigation = useNavigation();

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      // Web: Use window.alert with title and message combined
      window.alert(`${title}\n\n${message}`);
    } else {
      // Mobile: Use React Native Alert
      Alert.alert(title, message);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    if (!email.trim()) {
      showAlert('', 'Please enter your username');
      setLoading(false);
      return;
    }
    const result = await userCheck(email.trim());
    setLoading(false);
    if (result.success) {
        setStep('password');
        setStoreName(result.store.name);
        setStoreOwnerName(result.store.owner);
    } else {
      showAlert('', 'Username not found');
      setLoading(false);
      return;
    }
  };

  const handleBack = () => {
    setStep('username');
    setPassword(''); // Clear password when going back
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      showAlert('', 'Please enter your password');
      return;
    }

    setLoading(true);

    const response = await login(email.trim(), password.trim());
    console.log(222, response)
    if (response.passwordMatches) {
      setLoading(false);
      setEmail('');
      setPassword('');
      setStep('username');
    } else {
      showAlert('Login Failed', 'Invalid credentials');
      setLoading(false);
    }
  };

  const handleAddStore = () => {
    navigation.navigate('StoreRegistration');
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
              <Text style={styles.title}>Store Owner</Text>
              <Text style={styles.subtitle}>
                {step === 'username' 
                  ? 'Enter your username to continue' 
                  : 'Enter your password to sign in'
                }
              </Text>
            </View>

            <View style={styles.form}>
              {step === 'username' ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your username"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleContinue}
                  >
                    <Text style={styles.loginButtonText}>
                      {loading ? (
                          <ActivityIndicator color={COLORS.white} />
                      ) : (
                          <Text style={styles.loginButtonText}>Continue</Text>
                      )}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.addStoreButton}
                    onPress={handleAddStore}
                  >
                    <Text style={styles.addStoreButtonText}>Add your store</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepInfoLabel}>Welcome </Text>
                    <Text style={styles.stepInfoValue}>{storeOwnerName} ({storeName})</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                    />
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleBack}
                    >
                      <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.loginButton, styles.loginButtonFlex, loading && styles.loginButtonDisabled]}
                      onPress={handleLogin}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <Text style={styles.loginButtonText}>Sign In</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            <View style={styles.demoInfo}>
              <Text style={styles.demoTitle}>Demo Credentials:</Text>
              <Text style={styles.demoText}>username: cakebydee</Text>
              <Text style={styles.demoText}>Password: cakebydee</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
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
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  loginButtonFlex: {
    flex: 1,
    marginLeft: 12,
  },
  stepInfo: {
    backgroundColor: COLORS.primaryWithOpacity,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepInfoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 8,
  },
  stepInfoValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  backButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  demoInfo: {
    backgroundColor: COLORS.primaryWithOpacity,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  demoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  addStoreButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: COLORS.transparent,
  },
  addStoreButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '600',
  },
});
