// src/assets/logoRegistry.ts
// Centralized logo imports for all stores with default fallback

// Default logo for stores without specific logos
const defaultLogo = require('./logos/default-store.png');

export const storeLogos = {
  // Multi-category stores
  carrefour: require('./logos/carrefour.png'),
  hyperone: require('./logos/hyperone.png'),
  kazyon: require('./logos/kazyon.png'),
  awladragab: require('./logos/awladragab.png'),

  // Food-focused stores
  metro: require('./logos/metro.png'),
  spinneys: require('./logos/spinneys.png'),
  seoudi: require('./logos/seoudi.png'),
  kheirzaman: require('./logos/kheirzaman.png'),
  fathalla: require('./logos/fathalla.png'),
  bim: require('./logos/bim.png'),
  gomla: require('./logos/gomla.png'),
  pandah: require('./logos/pandah.png'),

  // Electronics stores
  btech: require('./logos/btech.png'),
  oscar: require('./logos/oscar.png'),
  extra: require('./logos/extra.png'),

  // Local stores by governorate
  sharkia_local: require('./logos/sharkia_local.png'),
  dakahlia_local: require('./logos/dakahlia_local.png'),
  cairo_local: require('./logos/cairo_local.png'),

  // Default fallback
  default: defaultLogo,
} as const;

export type StoreLogoKey = keyof typeof storeLogos;

// Helper function to get logo by store ID with fallback to default
export const getStoreLogo = (storeId: string) => {
  const logo = storeLogos[storeId as StoreLogoKey];
  return logo || storeLogos.default;
};

// Helper function to safely get logo with error handling
export const getStoreLogoSafe = (storeId: string) => {
  try {
    const logo = storeLogos[storeId as StoreLogoKey];
    return logo || storeLogos.default;
  } catch (error) {
    console.warn(`Failed to load logo for store: ${storeId}, using default`);
    return storeLogos.default;
  }
};