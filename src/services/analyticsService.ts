// src/services/analyticsService.ts
import { logEvent as firebaseLogEvent, setUserProperties as firebaseSetUserProperties } from 'firebase/analytics';
import { getAnalyticsInstance } from '../config/firebase';
import { Platform } from 'react-native';

/**
 * Analytics service with cross-platform support
 * Provides safe wrappers around Firebase Analytics that handle null analytics instance
 */

/**
 * Log a custom event
 */
export const logEvent = (eventName: string, params?: Record<string, any>) => {
  try {
    const analytics = getAnalyticsInstance();
    if (analytics && Platform.OS === 'web') {
      firebaseLogEvent(analytics, eventName, params);
      console.log('📊 Analytics event:', eventName, params);
    }
  } catch (error) {
    console.warn('⚠️ Failed to log analytics event:', error);
  }
};

/**
 * Log screen view
 */
export const logScreenView = (screenName: string, screenClass?: string) => {
  logEvent('screen_view', {
    screen_name: screenName,
    screen_class: screenClass || screenName,
  });
};

/**
 * Log when user selects content
 */
export const logSelectContent = (contentType: string, itemId: string, params?: Record<string, any>) => {
  logEvent('select_content', {
    content_type: contentType,
    item_id: itemId,
    ...params,
  });
};

/**
 * Log search event
 */
export const logSearch = (searchTerm: string, params?: Record<string, any>) => {
  logEvent('search', {
    search_term: searchTerm,
    ...params,
  });
};

/**
 * Log add to cart event
 */
export const logAddToCart = (itemId: string, itemName: string, price?: number, params?: Record<string, any>) => {
  logEvent('add_to_cart', {
    item_id: itemId,
    item_name: itemName,
    price: price,
    ...params,
  });
};

/**
 * Log view item event
 */
export const logViewItem = (itemId: string, itemName: string, itemCategory?: string, params?: Record<string, any>) => {
  logEvent('view_item', {
    item_id: itemId,
    item_name: itemName,
    item_category: itemCategory,
    ...params,
  });
};

/**
 * Log view item list event
 */
export const logViewItemList = (itemListId: string, itemListName: string, params?: Record<string, any>) => {
  logEvent('view_item_list', {
    item_list_id: itemListId,
    item_list_name: itemListName,
    ...params,
  });
};

/**
 * Set user properties
 */
export const setUserProperties = (properties: Record<string, any>) => {
  try {
    const analytics = getAnalyticsInstance();
    if (analytics && Platform.OS === 'web') {
      firebaseSetUserProperties(analytics, properties);
      console.log('📊 User properties set:', properties);
    }
  } catch (error) {
    console.warn('⚠️ Failed to set user properties:', error);
  }
};

/**
 * Analytics service export
 */
export const analyticsService = {
  logEvent,
  logScreenView,
  logSelectContent,
  logSearch,
  logAddToCart,
  logViewItem,
  logViewItemList,
  setUserProperties,
};

export default analyticsService;
