import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { COLORS } from '../utils/colors';

const { width: screenWidth } = Dimensions.get('window');

export default function Toast({ 
  visible, 
  message, 
  type = 'success', // 'success', 'error', 'warning', 'info'
  duration = 3000,
  position = 'top', // 'top', 'bottom', 'center'
  onHide 
}) {
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: COLORS.success,
          icon: '',
        };
      case 'error':
        return {
          backgroundColor: COLORS.error,
          icon: '',
        };
      case 'warning':
        return {
          backgroundColor: COLORS.warning,
          icon: '',
        };
      case 'info':
        return {
          backgroundColor: COLORS.primary,
          icon: '',
        };
      default:
        return {
          backgroundColor: COLORS.primary,
          icon: '',
        };
    }
  };

  const typeStyles = getTypeStyles();

  const getContainerStyle = () => {
    const base = {
      position: 'absolute',
      left: 20,
      right: 20,
      zIndex: 9999,
    };

    if (position === 'top') {
      return { ...base, top: Platform.OS === 'web' ? 20 : 60 };
    } else if (position === 'bottom') {
      return { ...base, bottom: Platform.OS === 'web' ? 20 : 100 };
    } else {
      return { 
        ...base, 
        top: '50%', 
        marginTop: -30,
      };
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.container, getContainerStyle()]} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: typeStyles.backgroundColor,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={styles.icon}>{typeStyles.icon}</Text>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    maxWidth: screenWidth - 40,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  message: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
});
