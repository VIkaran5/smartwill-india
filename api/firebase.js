const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    // Requires FIREBASE_SERVICE_ACCOUNT environment variable to be a stringified JSON of the service account
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
    
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      admin.initializeApp(); // Default config
    }
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
    admin.initializeApp();
  }
}

const db = admin.firestore();

module.exports = { admin, db };
