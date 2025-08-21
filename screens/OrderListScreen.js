import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  TextInput,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import {fetchProductsByStoreId, deleteProduct, fetchOrdersByStoreId, fetchProductById} from '../data/api';
import { COLORS } from '../utils/colors';

export default function ProductListScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);


  const loadProducts = async () => {
    setLoading(true)
    try {
      const response =  await fetchOrdersByStoreId(user.id)
      console.log(22, response)
      const enriched = await Promise.all(

          response.map(async (order) => {
            console.log(111, order);
            // Enrich each product inside the order
            const enrichedProducts = await Promise.all(
                order.products.map(async (product) => {
                  const productDetails = await fetchProductById(
                      product.productId._id
                  );

                  return {
                    ...product,
                    productDetails,
                  };
                })
            );
            return {
              orderId: order.orderId,
              status: order.status,
              createdAt: order.createdAt,
              store: order.storeId,
              user: order.userId,
              products: enrichedProducts,
            };
          })
      );

      const enrichedOrders = enriched.map(order => {
        const totalPrice = order.products.reduce((sum, product) => {
          const price = Number(product.productDetails.price); // string → number
          return sum + price * product.quantity;
        }, 0);

        return {
          ...order,
          totalPrice,
        };
      });

      setUserOrders(enrichedOrders);
      console.log('User orders loaded:', enrichedOrders);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error loading user orders:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  const renderOrdersSection = () => (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Orders</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.viewAllText}>Refresh ↻</Text>
          </TouchableOpacity>
        </View>

        {userOrders.length === 0 ? (
            <View style={styles.emptyOrdersContainer}>
              <Text style={styles.emptyOrdersText}>No orders yet</Text>
              <Text style={styles.emptyOrdersSubtext}>Start shopping to see your orders here</Text>
            </View>
        ) : (
            userOrders.map((order) => (
                <TouchableOpacity
                    onPress={() => showOrderOptionsModal(order.store._id, order.orderId)}
                    key={order.id}
                    style={styles.orderCard}>

                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>Order #{order.orderId}</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>
                        {order.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                  <Text style={styles.orderStore}>{order.store.name}</Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.productsList}>
                      {order.products.map((p, index) => (
                          <View key={index} style={styles.productRow}>
                            <Text style={styles.orderItems}>
                              {p.productDetails.name} × {p.quantity}
                            </Text>
                          </View>
                      ))}
                    </View>

                    <Text style={styles.orderTotal}>
                      Rs.{order.totalPrice}
                    </Text>
                  </View>
                </TouchableOpacity>
            ))
        )}
      </View>
  );

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
    );
  } else {
    return (
        <SafeAreaView style={styles.container}>
          <ScrollView
              style={styles.scrollView}
              refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[COLORS.primary]}
                    tintColor={COLORS.primary}
                />
              }
          >
            {renderOrdersSection()}
          </ScrollView>
        </SafeAreaView>
    );
  }
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
  section: {
    margin: 25,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  orderStore: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItems: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
