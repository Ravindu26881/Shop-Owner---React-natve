# ImgBB Integration Setup Guide

This guide explains how to set up ImgBB API integration for image uploads in your store registration form.

## Setup Instructions

### 1. Get Your ImgBB API Key

1. Visit [ImgBB API website](https://api.imgbb.com/)
2. Click "Get API Key" or "Sign Up"
3. Create a free account:
   - Enter your email address
   - Choose a secure password
   - Verify your email
4. After login, go to your dashboard
5. Copy your **API Key** (looks like: `abc123def456789`)

### 2. Configure Your App

1. Open the file: `config/imageHosting.js`
2. Replace `'YOUR_IMGBB_API_KEY_HERE'` with your actual API Key:

```javascript
export const IMGBB_API_KEY = 'your_actual_api_key_here';
```

### 3. How It Works

- **Image Selection**: Users can pick images from gallery or take photos
- **Auto Upload**: Images are automatically uploaded to ImgBB after selection  
- **URL Storage**: The ImgBB URL (not local file path) is stored in form data
- **Permanent Storage**: Images are stored permanently (no expiration)
- **Fallback**: If upload fails, local URI is used as fallback
- **Loading States**: Shows upload progress to users
- **Error Handling**: Graceful error handling with user-friendly messages

## User Experience

### Without ImgBB API Key:
- Shows configuration alert when user selects image
- Falls back to using local image URI
- Form still works, but images are local only

### With ImgBB API Key:
- Seamless upload experience
- Images are publicly accessible via ImgBB URLs
- Perfect for production use

## ImgBB vs Transfer.sh Comparison

| Feature | ImgBB | Transfer.sh |
|---------|--------|-------------|
| **Permanence** | Permanent storage | Files expire (14 days) |
| **Purpose** | Image hosting | Temporary file sharing |
| **API Quality** | Dedicated image API | Basic file upload |
| **File Size** | Up to 32MB | Various limits |
| **Reliability** | High uptime | Moderate |
| **Free Tier** | Generous limits | Free but temporary |

## Security Notes

- **API Key is safe** to use in client-side code for uploads
- **No sensitive data** is exposed
- For enhanced security in production, consider server-side uploads

## Troubleshooting

### "ImgBB API Not Configured" Alert
- **Cause**: API key is still set to `'YOUR_IMGBB_API_KEY_HERE'`
- **Solution**: Replace with your actual API key in `config/imageHosting.js`

### Upload Fails
- **Cause**: Network issues, invalid API key, or file too large (>32MB)
- **Result**: App falls back to local image URI
- **Solution**: Check your internet connection, verify API key, or reduce image size

### Image Not Displaying
- **Cause**: Invalid ImgBB URL or network issues
- **Solution**: Check browser console for errors

## Form Data Structure

After successful upload, the form data contains:

```javascript
{
  name: "Store Name",
  description: "Store Description", 
  owner: "Owner Name",
  category: "Category",
  image: "https://i.ibb.co/AbC123D/store-image.jpg", // ImgBB URL
  username: "username", 
  password: "password"
}
```

## API Endpoint Used

- **URL**: `https://api.imgbb.com/1/upload`
- **Method**: POST
- **Body**: FormData with API key and base64 image
- **File Limit**: 32MB maximum

## Example Response

```json
{
  "data": {
    "id": "AbC123D",
    "title": "store-image",
    "url_viewer": "https://ibb.co/AbC123D",
    "url": "https://i.ibb.co/AbC123D/store-image.jpg",
    "display_url": "https://i.ibb.co/AbC123D/store-image.jpg"
  },
  "success": true,
  "status": 200
}
```

## ImgBB Features

- **Free Forever**: No hidden costs
- **No Account Required**: Anonymous uploads supported
- **Image Optimization**: Automatic optimization
- **CDN Powered**: Fast global delivery
- **Mobile Friendly**: Works perfectly with React Native
- **Direct Links**: Get direct image URLs instantly

---

**Need help?** Check the [ImgBB API documentation](https://api.imgbb.com/) for more details.
