// src/app/notification-test.tsx - FOR TESTING NOTIFICATIONS
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { notificationService } from '../services/notifications';
import { NOTIFICATION_TOPICS } from '../constants/config';
import { useAppSelector } from '../store/hooks';

export default function NotificationTestScreen() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [subscribedTopics, setSubscribedTopics] = useState<string[]>([]);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    checkPermissions();
    if (user?.uid) {
      loadSubscribedTopics();
    }
  }, [user]);

  const checkPermissions = async () => {
    try {
      const hasPermission = await notificationService.requestPermissions();
      setPermissionStatus(hasPermission ? 'granted' : 'denied');
      
      if (hasPermission) {
        const token = await notificationService.getExpoPushToken();
        setPushToken(token);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const loadSubscribedTopics = async () => {
    if (!user?.uid) return;
    
    try {
      const topics = await notificationService.getUserTopics(user.uid);
      setSubscribedTopics(topics);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const handleTestLocalNotification = async () => {
    try {
      const result = await notificationService.scheduleLocalNotification(
        'اختبار الإشعار المحلي 🔔',
        'هذا إشعار محلي للاختبار. يظهر فوراً!',
        {
          test: true,
          timestamp: Date.now(),
        }
      );

      if (result) {
        showAlert('✅ نجح', 'تم إرسال الإشعار المحلي!');
      }
    } catch (error: any) {
      showAlert('❌ خطأ', error.message);
    }
  };

  const handleTestScheduledNotification = async () => {
    try {
      const trigger = {
        seconds: 5, // 5 seconds from now
      };

      const result = await notificationService.scheduleLocalNotification(
        'إشعار مجدول ⏰',
        'هذا إشعار تم جدولته قبل 5 ثوان!',
        {
          scheduled: true,
          timestamp: Date.now(),
        },
        trigger
      );

      if (result) {
        showAlert('✅ نجح', 'تم جدولة الإشعار! سيظهر بعد 5 ثوان');
      }
    } catch (error: any) {
      showAlert('❌ خطأ', error.message);
    }
  };

  const handleSubscribeToTopic = async (topic: string) => {
    if (!user?.uid) {
      showAlert('خطأ', 'يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      const success = await notificationService.subscribeToTopic(user.uid, topic);
      if (success) {
        await loadSubscribedTopics();
        showAlert('✅ نجح', `تم الاشتراك في: ${getTopicName(topic)}`);
      }
    } catch (error: any) {
      showAlert('❌ خطأ', error.message);
    }
  };

  const handleUnsubscribeFromTopic = async (topic: string) => {
    if (!user?.uid) {
      showAlert('خطأ', 'يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      const success = await notificationService.unsubscribeFromTopic(user.uid, topic);
      if (success) {
        await loadSubscribedTopics();
        showAlert('✅ نجح', `تم إلغاء الاشتراك من: ${getTopicName(topic)}`);
      }
    } catch (error: any) {
      showAlert('❌ خطأ', error.message);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const getTopicName = (topic: string): string => {
    const names: Record<string, string> = {
      [NOTIFICATION_TOPICS.NEW_OFFERS]: 'عروض جديدة',
      [NOTIFICATION_TOPICS.EXPIRING_OFFERS]: 'عروض توشك على الانتهاء',
      [NOTIFICATION_TOPICS.FAVORITE_STORES]: 'متاجر مفضلة',
    };
    return names[topic] || topic;
  };

  const isSubscribed = (topic: string): boolean => {
    return subscribedTopics.includes(topic);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="notifications" size={40} color={colors.primary} />
        <Text style={styles.headerTitle}>اختبار الإشعارات</Text>
        <Text style={styles.headerSubtitle}>
          تحقق من وظائف الإشعارات والصلاحيات
        </Text>
      </View>

      {/* Permission Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>حالة الصلاحيات</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons
              name={permissionStatus === 'granted' ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={permissionStatus === 'granted' ? colors.success : colors.error}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>إذن الإشعارات</Text>
              <Text style={styles.statusValue}>
                {permissionStatus === 'granted' ? 'مسموح ✅' : 'غير مسموح ❌'}
              </Text>
            </View>
          </View>

          {pushToken && (
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenLabel}>Push Token:</Text>
              <Text style={styles.tokenValue} numberOfLines={2}>
                {pushToken}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => {
                  // Copy to clipboard logic here
                  showAlert('✅', 'تم نسخ الرمز');
                }}
              >
                <Ionicons name="copy" size={16} color={colors.primary} />
                <Text style={styles.copyButtonText}>نسخ</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Test Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>اختبار الإشعارات المحلية</Text>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={handleTestLocalNotification}
          disabled={permissionStatus !== 'granted'}
        >
          <Ionicons name="notifications" size={24} color={colors.white} />
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>إشعار فوري</Text>
            <Text style={styles.buttonSubtitle}>يظهر الآن مباشرة</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={handleTestScheduledNotification}
          disabled={permissionStatus !== 'granted'}
        >
          <Ionicons name="time" size={24} color={colors.white} />
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>إشعار مجدول</Text>
            <Text style={styles.buttonSubtitle}>يظهر بعد 5 ثوان</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Topic Subscriptions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الاشتراك في المواضيع</Text>
        <Text style={styles.sectionDescription}>
          اشترك في المواضيع لتلقي إشعارات مخصصة
        </Text>

        {Object.values(NOTIFICATION_TOPICS).map((topic) => (
          <View key={topic} style={styles.topicCard}>
            <View style={styles.topicInfo}>
              <Ionicons
                name="pricetag"
                size={20}
                color={isSubscribed(topic) ? colors.primary : colors.gray[400]}
              />
              <Text style={styles.topicName}>{getTopicName(topic)}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.topicToggle,
                isSubscribed(topic) && styles.topicToggleActive
              ]}
              onPress={() => {
                if (isSubscribed(topic)) {
                  handleUnsubscribeFromTopic(topic);
                } else {
                  handleSubscribeToTopic(topic);
                }
              }}
              disabled={!user}
            >
              <Text style={[
                styles.topicToggleText,
                isSubscribed(topic) && styles.topicToggleTextActive
              ]}>
                {isSubscribed(topic) ? 'مشترك' : 'اشترك'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {!user && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={20} color={colors.warning} />
            <Text style={styles.warningText}>
              يجب تسجيل الدخول للاشتراك في المواضيع
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={24} color={colors.primary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>معلومات مهمة:</Text>
          <Text style={styles.infoText}>
            • الإشعارات المحلية تعمل حتى بدون إنترنت{'\n'}
            • الإشعارات عن بُعد تتطلب اتصال بالإنترنت{'\n'}
            • يمكن للمسؤول إرسال إشعارات من لوحة التحكم{'\n'}
            • يتم حفظ Push Token في Firebase
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.md,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  section: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    marginTop: -spacing.sm,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  statusValue: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  tokenContainer: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  tokenLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tokenValue: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    alignSelf: I18nManager.isRTL ? 'flex-end' : 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  copyButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  testButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  buttonSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  topicCard: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  topicInfo: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  topicName: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  topicToggle: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  topicToggleActive: {
    backgroundColor: colors.primary,
  },
  topicToggleText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  topicToggleTextActive: {
    color: colors.white,
  },
  warningCard: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  infoSection: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    backgroundColor: colors.primary + '10',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  infoContent: {
    flex: 1,
    gap: spacing.xs,
  },
  infoTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    lineHeight: 20,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
});