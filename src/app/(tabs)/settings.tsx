// src/app/(tabs)/settings.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  I18nManager,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setLanguage, setNotificationsEnabled } from '../../store/slices/settingsSlice';
import { signOut, clearUser } from '../../store/slices/authSlice';
import { clearBasket } from '../../store/slices/basketSlice';
import { clearFavorites } from '../../store/slices/favoritesSlice';
import { changeLanguage } from '../../i18n';
import { usePersistSettings, useSafeTabBarHeight } from '../../hooks';
import { APP_CONFIG } from '../../constants/config';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { paddingBottom } = useSafeTabBarHeight();

  usePersistSettings();

  const settings = useAppSelector(state => state.settings);
  const favoriteStoreIds = useAppSelector(state => state.favorites.storeIds);
  const { user, isAuthenticated, isAdmin } = useAppSelector(state => state.auth);

  const handleLanguageChange = async (language: 'ar' | 'en') => {
    await changeLanguage(language);
    dispatch(setLanguage(language));

    if ((language === 'ar') !== I18nManager.isRTL) {
      Alert.alert(
        'تنبيه',
        'يتطلب تغيير اللغة إعادة تشغيل التطبيق لتفعيل اتجاه النص بشكل صحيح.',
        [{ text: 'حسناً' }]
      );
    }
  };

  const handleNotificationsToggle = () => {
    dispatch(setNotificationsEnabled(!settings.notificationsEnabled));
  };

  const handleSignIn = () => {
    router.push('/auth/sign-in');
  };

  const handleSignOut = async () => {
    console.log('🔴 [Settings] handleSignOut CALLED!');
    console.log('🔴 [Settings] Current auth state:', {
      isAuthenticated,
      userEmail: user?.email,
      isAdmin
    });

    // Web-compatible confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('هل أنت متأكد من تسجيل الخروج؟');
      console.log('🔴 [Settings] Web confirm result:', confirmed);

      if (!confirmed) {
        console.log('🔴 [Settings] User cancelled sign out');
        return;
      }
    } else {
      // Native Alert for mobile
      Alert.alert(
        'تسجيل الخروج',
        'هل أنت متأكد من تسجيل الخروج؟',
        [
          {
            text: 'إلغاء',
            style: 'cancel',
            onPress: () => console.log('🔴 [Settings] User cancelled sign out'),
          },
          {
            text: 'تسجيل الخروج',
            style: 'destructive',
            onPress: () => performSignOut(),
          },
        ]
      );
      return;
    }

    // For web, continue immediately if confirmed
    await performSignOut();
  };

  const performSignOut = async () => {
    try {
      console.log('🔵 [Settings] User confirmed sign out');
      console.log('🔵 [Settings] Auth state before:', {
        isAuthenticated,
        userEmail: user?.email
      });

      // Call signOut thunk
      console.log('🔵 [Settings] Dispatching signOut thunk...');
      await dispatch(signOut()).unwrap();
      console.log('✅ [Settings] Sign out from Firebase successful');

      // Clear all user-related data AFTER sign out completes
      console.log('🔵 [Settings] Clearing user data...');
      dispatch(clearUser());
      dispatch(clearBasket());
      dispatch(clearFavorites());
      console.log('✅ [Settings] User data cleared');

      // Navigate to auth screen
      console.log('🔵 [Settings] Navigating to sign-in...');
      router.replace('/auth/sign-in');

      // Show success message after navigation
      setTimeout(() => {
        if (Platform.OS === 'web') {
          alert('تم تسجيل الخروج بنجاح');
        } else {
          Alert.alert('نجح', 'تم تسجيل الخروج بنجاح');
        }
      }, 500);
    } catch (error: any) {
      console.error('❌ [Settings] Sign out error:', error);
      console.error('❌ [Settings] Error details:', JSON.stringify(error, null, 2));

      if (Platform.OS === 'web') {
        alert(`خطأ: ${error.message || 'فشل تسجيل الخروج. يرجى المحاولة مرة أخرى.'}`);
      } else {
        Alert.alert(
          'خطأ',
          error.message || 'فشل تسجيل الخروج. يرجى المحاولة مرة أخرى.'
        );
      }
    }
  };

  const handleAdminPanel = () => {
    router.push('/admin/dashboard');
  };

  const renderSettingItem = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle?: string,
    rightElement?: React.ReactNode,
    onPress?: () => void
  ) => {
    console.log(`🟡 [Settings] Rendering setting item: "${title}", onPress:`, onPress ? 'provided' : 'undefined');

    return (
      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => {
          console.log(`🟢 [Settings] Item clicked: "${title}"`);
          if (onPress) {
            console.log(`🟢 [Settings] Calling onPress for: "${title}"`);
            onPress();
          } else {
            console.log(`🟡 [Settings] No onPress handler for: "${title}"`);
          }
        }}
        disabled={!onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        {rightElement || (onPress && (
          <Ionicons
            name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
            size={24}
            color={colors.gray[400]}
          />
        ))}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom }}
      showsVerticalScrollIndicator={false}
    >
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.account') || 'الحساب'}</Text>
        <View style={styles.card}>
          {isAuthenticated && user ? (
            <>
              {/* User Profile */}
              <View style={styles.profileContainer}>
                {user.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={32} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{user.displayName || 'مستخدم'}</Text>
                  <Text style={styles.profileEmail}>{user.email}</Text>
                  {isAdmin && (
                    <View style={styles.adminBadge}>
                      <Ionicons name="shield-checkmark" size={14} color={colors.white} />
                      <Text style={styles.adminBadgeText}>مدير</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.divider} />

              {/* Admin Panel Link */}
              {(__DEV__ || isAdmin) && (
                <>
                  {renderSettingItem(
                    'settings',
                    'لوحة التحكم الإدارية',
                    __DEV__ && !isAdmin ? 'وضع المطور' : 'إدارة الكتالوجات والعروض',
                    undefined,
                    handleAdminPanel
                  )}
                  <View style={styles.divider} />
                </>
              )}

              {/* Sign Out Button */}
              {renderSettingItem(
                'log-out',
                'تسجيل الخروج',
                undefined,
                undefined,
                handleSignOut
              )}

              {/* TEST BUTTON - Remove after debugging */}
              {__DEV__ && (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={[styles.settingItem, { backgroundColor: '#ffebee' }]}
                    onPress={() => {
                      console.log('🔴 TEST BUTTON CLICKED');
                      handleSignOut();
                    }}
                  >
                    <Text style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                      TEST: Click to Sign Out
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            /* Sign In Button */
            renderSettingItem(
              'log-in',
              'تسجيل الدخول',
              'احفظ المفضلة والسلة عبر جميع أجهزتك',
              undefined,
              handleSignIn
            )
          )}
        </View>
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[
              styles.languageOption,
              i18n.language === 'ar' && styles.languageOptionActive,
            ]}
            onPress={() => handleLanguageChange('ar')}
          >
            <Text
              style={[
                styles.languageText,
                i18n.language === 'ar' && styles.languageTextActive,
              ]}
            >
              {t('settings.arabic')}
            </Text>
            {i18n.language === 'ar' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[
              styles.languageOption,
              i18n.language === 'en' && styles.languageOptionActive,
            ]}
            onPress={() => handleLanguageChange('en')}
          >
            <Text
              style={[
                styles.languageText,
                i18n.language === 'en' && styles.languageTextActive,
              ]}
            >
              {t('settings.english')}
            </Text>
            {i18n.language === 'en' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
        <View style={styles.card}>
          {renderSettingItem(
            'notifications',
            t('settings.notificationsEnabled'),
            undefined,
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.gray[300], true: colors.primaryLight }}
              thumbColor={settings.notificationsEnabled ? colors.primary : colors.gray[100]}
            />
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            'settings',
            t('settings.notificationSettings'),
            undefined,
            undefined,
            () => Alert.alert('قريباً', 'إعدادات الإشعارات قيد التطوير')
          )}
        </View>
      </View>

      {/* Favorites Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.favorites')}</Text>
        <View style={styles.card}>
          {renderSettingItem(
            'heart',
            t('settings.favoriteStores'),
            `${favoriteStoreIds.length} ${favoriteStoreIds.length === 1 ? 'متجر' : 'متاجر'}`,
            undefined,
            () => Alert.alert('قريباً', 'إدارة المفضلة قيد التطوير')
          )}
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <View style={styles.card}>
          {renderSettingItem(
            'help-circle',
            t('settings.help'),
            undefined,
            undefined,
            () => Alert.alert('المساعدة', 'للمساعدة تواصل معنا عبر البريد الإلكتروني')
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            'document-text',
            t('settings.privacyPolicy'),
            undefined,
            undefined,
            () => Alert.alert('قريباً', 'سياسة الخصوصية قيد الإعداد')
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            'document',
            t('settings.termsOfService'),
            undefined,
            undefined,
            () => Alert.alert('قريباً', 'شروط الخدمة قيد الإعداد')
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            'information-circle',
            t('settings.version'),
            APP_CONFIG.version
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: I18nManager.isRTL ? 0 : spacing.md,
    marginLeft: I18nManager.isRTL ? spacing.md : 0,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  settingSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginLeft: I18nManager.isRTL ? 0 : 72,
    marginRight: I18nManager.isRTL ? 72 : 0,
  },
  languageOption: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  languageOptionActive: {
    backgroundColor: colors.primaryLight + '10',
  },
  languageText: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
  },
  languageTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  profileContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: I18nManager.isRTL ? 0 : spacing.md,
    marginLeft: I18nManager.isRTL ? spacing.md : 0,
  },
  avatarPlaceholder: {
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  profileEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  adminBadge: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: I18nManager.isRTL ? 'flex-end' : 'flex-start',
    marginTop: spacing.xs,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontWeight: '600',
  },
});