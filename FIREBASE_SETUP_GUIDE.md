# Firebase Setup Guide for Salud MVP

This guide will walk you through the process of creating a real Firebase project and deploying your application to Firebase hosting.

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click on "Add project"
3. Enter a project name (e.g., "Salud-Language-Learning")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 2. Register Your Web App

1. Once your project is created, click on the web icon (</>) to add a web app
2. Enter a nickname for your app (e.g., "Salud Web App")
3. Check the box for "Also set up Firebase Hosting"
4. Click "Register app"
5. You'll be shown your Firebase configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

6. Copy this configuration object

## 3. Update Your Firebase Configuration

1. Open the `firebase.js` file in your project
2. Replace the existing configuration with your new Firebase configuration:

```javascript
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

## 4. Enable Firestore Database

1. In the Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for now (you can update security rules later)
4. Select a location for your database
5. Click "Enable"

## 5. Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

## 6. Login to Firebase

```bash
firebase login
```

This will open a browser window for you to authenticate with your Google account.

## 7. Initialize Firebase in Your Project

```bash
firebase init
```

When prompted:
- Select "Firestore" and "Hosting"
- Select your Firebase project
- Accept the default Firestore rules file
- Accept the default Firestore indexes file
- For the public directory, enter "out" (for Next.js static export)
- Configure as a single-page app: Yes
- Set up automatic builds and deploys with GitHub: No (unless you want to)

## 8. Update Your package.json Build Script

Make sure your package.json has the correct build script for Next.js static export:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build && next export",
  "start": "next start",
  "lint": "next lint",
  "firebase-deploy": "next build && next export && firebase deploy"
}
```

## 9. Update next.config.js

Ensure your next.config.js is configured for static export:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  output: 'export',
};

module.exports = nextConfig;
```

## 10. Deploy to Firebase

```bash
npm run firebase-deploy
```

Or:

```bash
next build && next export && firebase deploy
```

After deployment, Firebase will provide you with a hosting URL where your application is live.

## 11. Verify Your Deployment

1. Visit the provided hosting URL
2. Test the form submission functionality
3. Check the Firestore Database in the Firebase Console to verify that data is being saved

## Troubleshooting

If you encounter any issues:

1. Check the Firebase console for error messages
2. Verify that your Firebase configuration is correct
3. Make sure your Firestore security rules allow write access
4. Check the browser console for any JavaScript errors

## Next Steps

1. Implement proper authentication
2. Update Firestore security rules for production
3. Add more Firebase features like Storage or Cloud Functions
