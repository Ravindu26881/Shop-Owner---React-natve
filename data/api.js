// API endpoint
const API_URL = 'https://products-api-production-124f.up.railway.app';

// Store API functions
export const fetchStores = async () => {
  try {
    const response = await fetch(`${API_URL}/stores`);
    if (!response.ok) {
      throw new Error('Failed to fetch stores');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching stores:', error);
    throw error;
  }
};

export const saveStore = async (storeData) => {
  try {
    const response = await fetch(`${API_URL}/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(storeData),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch stores');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching stores:', error);
    throw error;
  }
};

export const saveStoreLocation = async (storeId, lng, lat) => {
  let body = JSON.stringify({
    "lat": lat,
    "lng": lng
  });
  try {
    const response = await fetch(`${API_URL}/stores/${storeId}/location`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    });
    if (!response.ok) {
      throw new Error('Failed to fetch stores');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching stores:', error);
    throw error;
  }
};

export const updateStore = async (storeId, storeData) => {
  try {
    const response = await fetch(`${API_URL}/stores/${storeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(storeData),
    });
    if (!response.ok) {
      throw new Error('Failed to update store');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating store:', error);
    throw error;
  }
};



export const fetchStoreById = async (storeId) => {
  try {
    const response = await fetch(`${API_URL}/stores/${storeId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch store');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching store:', error);
    throw error;
  }
};

export const fetchStoreByUserName = async (username) => {
    const response = await fetch(`${API_URL}/stores/check-username`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
    });
    return await response.json();
};

export const verifyPassword = async (username, password) => {
  const response = await fetch(`${API_URL}/stores/verify-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username: username, password: password }),
  });
  return await response.json();
};


// Product API functions
export const fetchProductsByStoreId = async (storeId) => {
  try {
    const response = await fetch(`${API_URL}/stores/${storeId}/products`, {}) ;
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const fetchProductById = async ( productId) => {
  try {
    const response = await fetch(API_URL + '/products/' + productId);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const addProduct = async (productData) => {
  try {
    const response = await fetch(`${API_URL}/stores/${productData.store}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    if (!response.ok) {
      throw new Error('Failed to add product');
    }
    return await response.json();
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    if (!response.ok) {
      throw new Error('Failed to update product');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Authentication (mock for now - you can implement real auth later)
export const authenticateStoreOwner = async (email, password) => {
  try {
    // Mock authentication - replace with real API call
    if (email && password) {
      // For demo purposes, return a mock store owner
      return {
        id: '1',
        email: email,
        storeId: '676a9e68b3a5d58b4c123456', // Mock store ID
        storeName: 'Demo Store',
        token: 'mock-jwt-token'
      };
    }
    throw new Error('Invalid credentials');
  } catch (error) {
    console.error('Error authenticating:', error);
    throw error;
  }
};

export const fetchOrdersByStoreId = async (storeId) => {
  const response = await fetch(`${API_URL}/stores/${storeId}/orders`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  return await response.json();
};
