import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';
import ConfirmationModal from './ConfirmationModal';

// Context for global notifications
const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  // Toast state
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    message: '',
    type: 'success',
    position: 'top',
    duration: 3000,
  });

  // Modal state
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'default',
    buttons: [],
  });

  // Toast functions
  const showToast = useCallback((message, type = 'success', options = {}) => {
    setToastConfig({
      visible: true,
      message,
      type,
      position: options.position || 'top',
      duration: options.duration || 3000,
    });
  }, []);

  const showSuccess = useCallback((message, options) => {
    showToast(message, 'success', options);
  }, [showToast]);

  const showError = useCallback((message, options) => {
    showToast(message, 'error', options);
  }, [showToast]);

  const showWarning = useCallback((message, options) => {
    showToast(message, 'warning', options);
  }, [showToast]);

  const showInfo = useCallback((message, options) => {
    showToast(message, 'info', options);
  }, [showToast]);

  // Modal functions
  const showModal = useCallback((config) => {
    setModalConfig({
      visible: true,
      ...config,
    });
  }, []);

  const showConfirm = useCallback((title, message, onConfirm, onCancel) => {
    showModal({
      title,
      message,
      type: 'default',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            hideModal();
            if (onCancel) onCancel();
          },
        },
        {
          text: 'Confirm',
          onPress: () => {
            hideModal();
            if (onConfirm) onConfirm();
          },
        },
      ],
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastConfig(prev => ({ ...prev, visible: false }));
  }, []);

  const hideModal = useCallback(() => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  }, []);

  const value = {
    // Toast methods
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
    
    // Modal methods
    showModal,
    showConfirm,
    hideModal,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Global Toast */}
      <Toast
        {...toastConfig}
        onHide={hideToast}
      />
      
      {/* Global Modal */}
      <ConfirmationModal
        {...modalConfig}
        onClose={hideModal}
      />
    </NotificationContext.Provider>
  );
};

// Convenience component for quick notifications
export const withNotifications = (Component) => {
  return (props) => (
    <NotificationProvider>
      <Component {...props} />
    </NotificationProvider>
  );
};

export default NotificationProvider;
