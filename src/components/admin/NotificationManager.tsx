// src/components/admin/NotificationManager.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { NOTIFICATION_TOPICS } from '../../constants/config';
import { 
  notificationService, 
  NotificationData,
  NotificationHistory 
} from '../../services/notifications';
import { useAppSelector } from '../../store/hooks';

export const NotificationManager: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');

  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await notificationService.getNotificationHistory(50);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      showAlert('خطأ', 'يرجى إدخال عنوان ونص الإشعار');
      return;
    }

    if (!user?.uid) {
      showAlert('خطأ', 'يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      setSending(true);

      const notificationData: NotificationData = {
        title: title.trim(),
        body: body.trim(),
        data: {
          type: 'admin_broadcast',
          timestamp: Date.now(),
        },
      };

      // Add topic/user filter
      if (selectedTopic !== 'all') {
        notificationData.topic = selectedTopic;
      }

      const result = await notificationService.sendPushNotification(
        notificationData,
        user.uid
      );

      if (result.success) {
        showAlert('✅ نجح', result.message);
        setTitle('');
        setBody('');
        setSelectedTopic('all');
        
        // Refresh history
        if (activeTab === 'history') {
          await loadHistory();
        }
      } else {
        showAlert('❌ فشل', result.message);
      }
    } catch (error: any) {
      showAlert('❌ خطأ', error.message || 'حدث خطأ أثناء إرسال الإشعار');
    } finally {
      setSending(false);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      const result = await notificationService.scheduleLocalNotification(
        'إشعار تجريبي 🔔',
        'هذا إشعار محلي للاختبار',
        { test: true }
      );

      if (result) {
        showAlert('✅ نجح', 'تم إرسال الإشعار التجريبي المحلي');
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

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'غير معروف';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return 'غير معروف';
    }
  };

  const getTopicDisplayName = (topic?: string): string => {
    if (!topic) return 'الكل';
    
    const topicNames: Record<string, string> = {
      [NOTIFICATION_TOPICS.NEW_OFFERS]: 'عروض جديدة',
      [NOTIFICATION_TOPICS.EXPIRING_OFFERS]: 'عروض توشك على الانتهاء',
      [NOTIFICATION_TOPICS.FAVORITE_STORES]: 'متاجر مفضلة',
      all: 'جميع المستخدمين',
    };
    
    return topicNames[topic] || topic;
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'send' && styles.activeTab]}
          onPress={() => setActiveTab('send')}
        >
          <Ionicons
            name="send"
            size={20}
            color={activeTab === 'send' ? colors.primary : colors.textSecondary}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'send' && styles.activeTabText
          ]}>
            إرسال إشعار
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons
            name="time"
            size={20}
            color={activeTab === 'history' ? colors.primary : colors.textSecondary}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'history' && styles.activeTabText
          ]}>
            السجل
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'send' ? (
          <View style={styles.sendContainer}>
            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={styles.infoBannerText}>
                يمكنك إرسال إشعارات لجميع المستخدمين أو لمجموعة محددة
              </Text>
            </View>

            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>عنوان الإشعار *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="مثال: عروض جديدة متاحة الآن!"
                placeholderTextColor={colors.gray[400]}
                maxLength={100}
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            {/* Body Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>نص الإشعار *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={body}
                onChangeText={setBody}
                placeholder="مثال: تحقق من أحدث العروض في متجرنا"
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
              />
              <Text style={styles.charCount}>{body.length}/300</Text>
            </View>

            {/* Topic Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>المستلمون</Text>
              <View style={styles.topicContainer}>
                <TouchableOpacity
                  style={[
                    styles.topicButton,
                    selectedTopic === 'all' && styles.topicButtonActive
                  ]}
                  onPress={() => setSelectedTopic('all')}
                >
                  <Text style={[
                    styles.topicButtonText,
                    selectedTopic === 'all' && styles.topicButtonTextActive
                  ]}>
                    الكل
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.topicButton,
                    selectedTopic === NOTIFICATION_TOPICS.NEW_OFFERS && styles.topicButtonActive
                  ]}
                  onPress={() => setSelectedTopic(NOTIFICATION_TOPICS.NEW_OFFERS)}
                >
                  <Text style={[
                    styles.topicButtonText,
                    selectedTopic === NOTIFICATION_TOPICS.NEW_OFFERS && styles.topicButtonTextActive
                  ]}>
                    عروض جديدة
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.topicButton,
                    selectedTopic === NOTIFICATION_TOPICS.EXPIRING_OFFERS && styles.topicButtonActive
                  ]}
                  onPress={() => setSelectedTopic(NOTIFICATION_TOPICS.EXPIRING_OFFERS)}
                >
                  <Text style={[
                    styles.topicButtonText,
                    selectedTopic === NOTIFICATION_TOPICS.EXPIRING_OFFERS && styles.topicButtonTextActive
                  ]}>
                    عروض قريبة الانتهاء
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.topicButton,
                    selectedTopic === NOTIFICATION_TOPICS.FAVORITE_STORES && styles.topicButtonActive
                  ]}
                  onPress={() => setSelectedTopic(NOTIFICATION_TOPICS.FAVORITE_STORES)}
                >
                  <Text style={[
                    styles.topicButtonText,
                    selectedTopic === NOTIFICATION_TOPICS.FAVORITE_STORES && styles.topicButtonTextActive
                  ]}>
                    متاجر مفضلة
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>معاينة:</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewIcon}>
                    <Ionicons name="notifications" size={16} color={colors.white} />
                  </View>
                  <Text style={styles.previewTitle}>{title || 'عنوان الإشعار'}</Text>
                </View>
                <Text style={styles.previewBody}>{body || 'نص الإشعار'}</Text>
                <Text style={styles.previewMeta}>
                  المستلمون: {getTopicDisplayName(selectedTopic)}
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleSendNotification}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color={colors.white} />
                    <Text style={styles.buttonText}>إرسال الإشعار</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleSendTestNotification}
                disabled={sending}
              >
                <Ionicons name="bug" size={20} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>إشعار تجريبي</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* History Tab */
          <View style={styles.historyContainer}>
            {loadingHistory ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>جاري تحميل السجل...</Text>
              </View>
            ) : history.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off" size={60} color={colors.gray[300]} />
                <Text style={styles.emptyText}>لا يوجد إشعارات مرسلة</Text>
              </View>
            ) : (
              history.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <View style={[
                      styles.statusBadge,
                      item.status === 'sent' && styles.statusBadgeSent,
                      item.status === 'failed' && styles.statusBadgeFailed,
                    ]}>
                      <Text style={styles.statusBadgeText}>
                        {item.status === 'sent' ? 'تم الإرسال' : 'فشل'}
                      </Text>
                    </View>
                    <Text style={styles.historyDate}>{formatDate(item.sentAt)}</Text>
                  </View>
                  
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <Text style={styles.historyBody}>{item.body}</Text>
                  
                  <View style={styles.historyMeta}>
                    <View style={styles.historyMetaItem}>
                      <Ionicons name="people" size={14} color={colors.textSecondary} />
                      <Text style={styles.historyMetaText}>
                        {item.recipientCount || 0} مستلم
                      </Text>
                    </View>
                    
                    {item.topic && (
                      <View style={styles.historyMetaItem}>
                        <Ionicons name="pricetag" size={14} color={colors.textSecondary} />
                        <Text style={styles.historyMetaText}>
                          {getTopicDisplayName(item.topic)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingHorizontal: spacing.md,
  },
  tab: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  sendContainer: {
    gap: spacing.lg,
  },
  infoBanner: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoBannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: I18nManager.isRTL ? 'left' : 'right',
  },
  topicContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  topicButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },
  topicButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  topicButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  topicButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  previewSection: {
    gap: spacing.sm,
  },
  previewLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  previewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: spacing.sm,
  },
  previewHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  previewBody: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  previewMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  buttonContainer: {
    gap: spacing.sm,
  },
  button: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  historyContainer: {
    gap: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  historyItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  historyHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusBadgeSent: {
    backgroundColor: colors.success + '20',
  },
  statusBadgeFailed: {
    backgroundColor: colors.error + '20',
  },
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  historyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  historyBody: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  historyMeta: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: spacing.md,
  },
  historyMetaItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  historyMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});