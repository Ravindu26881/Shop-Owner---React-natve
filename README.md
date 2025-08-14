# SaleSale Store Owner App

A React Native mobile application for store owners to manage their products in the SaleSale marketplace.

## Features

### 🔐 Authentication
- Store owner login system
- Secure session management
- Auto-logout functionality

### 📦 Product Management
- **View Products**: Browse all products in your store
- **Add Products**: Create new products with images, pricing, and descriptions
- **Edit Products**: Update existing product information
- **Delete Products**: Remove products from your store
- **Search & Filter**: Find products quickly with search functionality

### 📊 Dashboard
- Product count overview
- Quick access to all features
- Clean, intuitive interface

### 📱 Mobile-First Design
- Responsive layout for all screen sizes
- Native iOS and Android support
- Smooth animations and transitions

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd StoreOwner-App
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on device/simulator:**
   - iOS: `npm run ios`
   - Android: `npm run android`
   - Web: `npm run web`

## Demo Credentials

For testing purposes, use these credentials:
- **Email:** demo@store.com
- **Password:** password123

## API Integration

The app connects to the SaleSale API at:
```
https://products-api-production-124f.up.railway.app
```

### Available Endpoints
- `GET /stores` - Fetch all stores
- `GET /stores/:id/products` - Fetch products for a store
- `POST /stores/:id/products` - Add new product
- `PUT /stores/:id/products/:productId` - Update product
- `DELETE /stores/:id/products/:productId` - Delete product

## Project Structure

```
StoreOwner-App/
├── screens/                 # App screens
│   ├── LoginScreen.js      # Authentication screen
│   ├── DashboardScreen.js  # Main dashboard
│   ├── ProductListScreen.js # Product management
│   └── AddEditProductScreen.js # Add/Edit products
├── contexts/               # React contexts
│   └── AuthContext.js     # Authentication state
├── data/                  # API services
│   └── api.js            # API functions
├── utils/                # Utilities
│   └── colors.js        # Color constants
└── App.js               # Main app component
```

## Key Technologies

- **React Native** - Mobile app framework
- **Expo** - Development platform
- **React Navigation** - Navigation library
- **AsyncStorage** - Local data persistence
- **React Context** - State management

## Features in Detail

### Authentication System
- JWT-based authentication (mock implementation)
- Persistent login sessions
- Secure logout with data cleanup

### Product Management
- **Add Products**: Form validation, image URL support, price formatting
- **Edit Products**: Pre-populated forms, real-time updates
- **Delete Products**: Confirmation dialogs, optimistic updates
- **List View**: Search, pull-to-refresh, empty states

### User Experience
- Loading states for all async operations
- Error handling with user-friendly messages
- Form validation with real-time feedback
- Responsive design for different screen sizes

## Development

### Adding New Features
1. Create new screens in the `screens/` directory
2. Add navigation routes in `App.js`
3. Implement API calls in `data/api.js`
4. Update authentication context if needed

### Styling Guidelines
- Use colors from `utils/colors.js`
- Follow consistent spacing (8px grid system)
- Maintain accessibility standards
- Test on both iOS and Android

## Deployment

### Building for Production
```bash
# iOS
expo build:ios

# Android
expo build:android
```

### Publishing to App Stores
Follow Expo's documentation for publishing to:
- Apple App Store
- Google Play Store

## Future Enhancements

- [ ] Real authentication with JWT
- [ ] Image upload functionality
- [ ] Order management
- [ ] Sales analytics
- [ ] Push notifications
- [ ] Offline support
- [ ] Multi-store support
- [ ] Inventory tracking

## Support

For questions or issues:
1. Check the API documentation
2. Review the customer app for reference
3. Test with demo credentials first

## License

This project is part of the SaleSale marketplace system.
