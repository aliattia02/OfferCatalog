// src/services/notifications.ts - COMPLETE FCM INTEGRATION
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { NOTIFICATION_TOPICS } from '../constants/config';
import { addBreadcrumb, captureError } from '../config/sentry';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  userId?: string;
  topic?: string;
  scheduled?: boolean;
  scheduledFor?: string;
}

interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  topic?: string;
  userId?: string;
  sentAt: any;
  sentBy: string;
  platform?: string;
  status: 'sent' | 'failed' | 'scheduled';
  recipientCount?: number;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize notification service
   */
  async initialize(userId?: string): Promise<void> {
    try {
      addBreadcrumb('Initializing notification service', 'notification');

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ Notification permissions denied');
        return;
      }

      // Get push token
      const token = await this.getExpoPushToken();
      if (token && userId) {
        await this.saveTokenToFirestore(userId, token);
      }

      // Set up listeners
      this.setupListeners();

      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      captureError(error as Error, {
        context: 'Initialize notifications',
      });
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Notification permissions not granted');
        await AsyncStorage.setItem('@notifications_permission', 'denied');
        return false;
      }

      await AsyncStorage.setItem('@notifications_permission', 'granted');
      console.log('✅ Notification permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      captureError(error as Error, {
        context: 'Request notification permissions',
      });
      return false;
    }
  }

  /**
   * Get Expo push token
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      if (this.expoPushToken) {
        return this.expoPushToken;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'عروض مصر - Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E63946',
          sound: 'default',
        });

        // Additional channels for different notification types
        await Notifications.setNotificationChannelAsync('offers', {
          name: 'عروض جديدة',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E63946',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('expiring', {
          name: 'عروض توشك على الانتهاء',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#FFA500',
        });
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: 'd348374e-ef60-41d7-8fb4-ed84ae0edff4', // From app.json
      });

      this.expoPushToken = token;
      console.log('📱 Push Token:', token);

      addBreadcrumb('Push token obtained', 'notification', {
        tokenPrefix: token.substring(0, 20),
      });

      return token;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      captureError(error as Error, {
        context: 'Get push token',
      });
      return null;
    }
  }

  /**
   * Save push token to Firestore
   */
  private async saveTokenToFirestore(userId: string, token: string): Promise<void> {
    try {
      const tokensRef = collection(db, 'pushTokens');

      // Check if token already exists for this user
      const q = query(tokensRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Create new token document
        await addDoc(tokensRef, {
          userId,
          token,
          platform: Platform.OS,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          active: true,
        });
        console.log('✅ Push token saved to Firestore');
      } else {
        // Update existing token
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          token,
          platform: Platform.OS,
          updatedAt: serverTimestamp(),
          active: true,
        });
        console.log('✅ Push token updated in Firestore');
      }
    } catch (error) {
      console.error('❌ Error saving push token:', error);
      captureError(error as Error, {
        context: 'Save push token',
        userId,
      });
    }
  }

  /**
   * Set up notification listeners
   */
  private setupListeners(): void {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received:', notification);
        addBreadcrumb('Notification received', 'notification', {
          title: notification.request.content.title,
        });
      }
    );

    // Handle notification response (when user taps on notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response);
        addBreadcrumb('Notification tapped', 'notification', {
          title: response.notification.request.content.title,
          data: response.notification.request.content.data,
        });

        // Handle navigation based on notification data
        this.handleNotificationResponse(response);
      }
    );
  }

  /**
   * Handle notification tap/response
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;

    // You can navigate to specific screens based on data
    if (data?.screen) {
      console.log('🔗 Navigate to:', data.screen);
      // Implement navigation logic here using expo-router
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
          badge: 1,
        },
        trigger: trigger || null, // null = immediate
      });

      console.log('✅ Local notification scheduled:', notificationId);

      addBreadcrumb('Local notification scheduled', 'notification', {
        title,
        immediate: !trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      captureError(error as Error, {
        context: 'Schedule local notification',
        title,
      });
      return null;
    }
  }

  /**
   * Send push notification via Expo's push service
   * This is called from admin panel
   */
  async sendPushNotification(
    notificationData: NotificationData,
    adminUserId: string
  ): Promise<{ success: boolean; message: string; ticketId?: string }> {
    try {
      addBreadcrumb('Sending push notification', 'notification', {
        title: notificationData.title,
        topic: notificationData.topic,
        userId: notificationData.userId,
      });

      let tokens: string[] = [];

      // Get recipient tokens
      if (notificationData.userId) {
        // Send to specific user
        const token = await this.getUserToken(notificationData.userId);
        if (token) tokens.push(token);
      } else if (notificationData.topic) {
        // Send to topic subscribers
        tokens = await this.getTopicSubscribers(notificationData.topic);
      } else {
        // Send to all users
        tokens = await this.getAllTokens();
      }

      if (tokens.length === 0) {
        return {
          success: false,
          message: 'لا يوجد مستخدمين لإرسال الإشعار إليهم',
        };
      }

      // Prepare notification messages
      const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data || {},
        badge: 1,
        channelId: 'default',
      }));

      // Send via Expo Push Notification service
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();

      // Save to notification history
      await this.saveNotificationHistory({
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data,
        topic: notificationData.topic,
        userId: notificationData.userId,
        sentAt: serverTimestamp(),
        sentBy: adminUserId,
        platform: Platform.OS,
        status: 'sent',
        recipientCount: tokens.length,
      });

      console.log('✅ Push notification sent:', result);

      return {
        success: true,
        message: `تم إرسال الإشعار إلى ${tokens.length} مستخدم`,
        ticketId: result.data?.[0]?.id,
      };
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      captureError(error as Error, {
        context: 'Send push notification',
        title: notificationData.title,
      });

      // Save failed notification
      await this.saveNotificationHistory({
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data,
        topic: notificationData.topic,
        userId: notificationData.userId,
        sentAt: serverTimestamp(),
        sentBy: adminUserId,
        platform: Platform.OS,
        status: 'failed',
      });

      return {
        success: false,
        message: 'فشل إرسال الإشعار: ' + (error as Error).message,
      };
    }
  }

  /**
   * Get user's push token from Firestore
   */
  private async getUserToken(userId: string): Promise<string | null> {
    try {
      const tokensRef = collection(db, 'pushTokens');
      const q = query(
        tokensRef,
        where('userId', '==', userId),
        where('active', '==', true)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        return snapshot.docs[0].data().token;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting user token:', error);
      return null;
    }
  }

  /**
   * Get all topic subscribers' tokens
   */
  private async getTopicSubscribers(topic: string): Promise<string[]> {
    try {
      const subscriptionsRef = collection(db, 'topicSubscriptions');
      const q = query(
        subscriptionsRef,
        where('topic', '==', topic),
        where('subscribed', '==', true)
      );
      const snapshot = await getDocs(q);

      const userIds = snapshot.docs.map(doc => doc.data().userId);

      // Get tokens for these users
      const tokens: string[] = [];
      for (const userId of userIds) {
        const token = await this.getUserToken(userId);
        if (token) tokens.push(token);
      }

      return tokens;
    } catch (error) {
      console.error('❌ Error getting topic subscribers:', error);
      return [];
    }
  }

  /**
   * Get all active push tokens
   */
  private async getAllTokens(): Promise<string[]> {
    try {
      const tokensRef = collection(db, 'pushTokens');
      const q = query(tokensRef, where('active', '==', true));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => doc.data().token);
    } catch (error) {
      console.error('❌ Error getting all tokens:', error);
      return [];
    }
  }

  /**
   * Save notification to history
   */
  private async saveNotificationHistory(data: Omit<NotificationHistory, 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, 'notificationHistory'), data);
      console.log('✅ Notification saved to history');
    } catch (error) {
      console.error('❌ Error saving notification history:', error);
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(limitCount = 50): Promise<NotificationHistory[]> {
    try {
      const historyRef = collection(db, 'notificationHistory');
      const q = query(
        historyRef,
        orderBy('sentAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as NotificationHistory));
    } catch (error) {
      console.error('❌ Error getting notification history:', error);
      captureError(error as Error, {
        context: 'Get notification history',
      });
      return [];
    }
  }

  /**
   * Subscribe to a topic
   */
  async subscribeToTopic(userId: string, topic: string): Promise<boolean> {
    try {
      const subscriptionsRef = collection(db, 'topicSubscriptions');

      // Check if already subscribed
      const q = query(
        subscriptionsRef,
        where('userId', '==', userId),
        where('topic', '==', topic)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(subscriptionsRef, {
          userId,
          topic,
          subscribed: true,
          subscribedAt: serverTimestamp(),
        });
      } else {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          subscribed: true,
          subscribedAt: serverTimestamp(),
        });
      }

      console.log(`✅ Subscribed to topic: ${topic}`);
      return true;
    } catch (error) {
      console.error('❌ Error subscribing to topic:', error);
      captureError(error as Error, {
        context: 'Subscribe to topic',
        topic,
        userId,
      });
      return false;
    }
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribeFromTopic(userId: string, topic: string): Promise<boolean> {
    try {
      const subscriptionsRef = collection(db, 'topicSubscriptions');
      const q = query(
        subscriptionsRef,
        where('userId', '==', userId),
        where('topic', '==', topic)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          subscribed: false,
          unsubscribedAt: serverTimestamp(),
        });
      }

      console.log(`✅ Unsubscribed from topic: ${topic}`);
      return true;
    } catch (error) {
      console.error('❌ Error unsubscribing from topic:', error);
      captureError(error as Error, {
        context: 'Unsubscribe from topic',
        topic,
        userId,
      });
      return false;
    }
  }

  /**
   * Get user's subscribed topics
   */
  async getUserTopics(userId: string): Promise<string[]> {
    try {
      const subscriptionsRef = collection(db, 'topicSubscriptions');
      const q = query(
        subscriptionsRef,
        where('userId', '==', userId),
        where('subscribed', '==', true)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => doc.data().topic);
    } catch (error) {
      console.error('❌ Error getting user topics:', error);
      return [];
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ All scheduled notifications cancelled');
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications() {
    return Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
export type { NotificationData, NotificationHistory };