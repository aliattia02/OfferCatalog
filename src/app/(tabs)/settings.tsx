import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  I18nManager,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setLanguage, setNotificationsEnabled } from '../../store/slices/settingsSlice';
import { changeLanguage } from '../../i18n';
import { usePersistSettings } from '../../hooks';
import { APP_CONFIG } from '../../constants/config';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  
  // Persist settings
  usePersistSettings();
  
  const settings = useAppSelector(state => state.settings);
  const favoriteStoreIds = useAppSelector(state => state.favorites.storeIds);

  const handleLanguageChange = async (language: 'ar' | 'en') => {
    await changeLanguage(language);
    dispatch(setLanguage(language));
    
    // Show alert about RTL change
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

  const renderSettingItem = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle?: string,
    rightElement?: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

      <View style={styles.bottomPadding} />
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
  bottomPadding: {
    height: spacing.xxl,
  },
});
