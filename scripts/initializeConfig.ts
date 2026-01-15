// scripts/initializeConfig.ts
import { initializeFirebase } from '../src/config/firebase';
import { doc, setDoc } from 'firebase/firestore';

const DEFAULT_CONFIG = {
  versionControl: {
    minimumVersion: "1.0.0",
    latestVersion: "1.0.0",
    forceUpdate: false,
    updateMessage: {
      ar: "يرجى تحديث التطبيق للحصول على أحدث الميزات",
      en: "Please update the app to get the latest features"
    },
    updateUrl: {
      ios: "https://apps.apple.com/app/your-app-id",
      android: "https://play.google.com/store/apps/details?id=com.yourcompany.offercatalog",
      web: "https://yourapp.com"
    }
  },
  announcementBar: {
    enabled: false,
    dismissible: true,
    type: "info",
    priority: "medium",
    message: {
      ar: "",
      en: ""
    }
  },
  advertisements: {
    enabled: false,
    bannerAds: {
      enabled: false,
      positions: [],
      ads: []
    },
    interstitialAds: {
      enabled: false,
      frequency: 5,
      ads: []
    }
  },
  features: {
    enableSearch: true,
    enableBasket: true,
    enableFavorites: true,
    maintenanceMode: false,
    enableAds: false
  }
};

async function initializeConfig() {
  try {
    const { db } = await initializeFirebase();
const configRef = doc(db, 'config', 'app');

await setDoc(configRef, DEFAULT_CONFIG, { merge: true });
    console.log('✅ Config initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing config:', error);
  }
}

initializeConfig();