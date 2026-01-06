import React from 'react';
import { Tabs } from 'expo-router';
import { I18nManager, View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, typography } from '../../constants/theme';
import { useAppSelector } from '../../store/hooks';

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const basketItems = useAppSelector(state => state.basket.items);
  const basketCount = basketItems.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate tab bar height based on platform and safe area
  const tabBarHeight = Platform.OS === 'ios'
    ? 60 + insets.bottom
    : 60;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[200],
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: '500',
          marginBottom: Platform.OS === 'android' ? 4 : 0,
        },
        headerStyle: {
          backgroundColor: colors.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray[200],
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: 'bold',
          fontSize: typography.fontSize.xl,
        },
        headerTitleAlign: 'center',
        // Important: Let each screen handle its own safe area
        headerStatusBarHeight: Platform.OS === 'ios' ? insets.top : undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerTitle: t('home.title'),
        }}
      />
      <Tabs.Screen
        name="flyers"
        options={{
          title: t('navigation.flyers'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag" size={size} color={color} />
          ),
          headerTitle: t('flyers.title'),
        }}
      />
      <Tabs.Screen
        name="basket"
        options={{
          title: t('navigation.basket'),
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="cart" size={size} color={color} />
              {basketCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {basketCount > 99 ? '99+' : basketCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          headerTitle: t('basket.title'),
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: t('navigation.stores'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront" size={size} color={color} />
          ),
          headerTitle: t('stores.title'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('navigation.settings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
          headerTitle: t('settings.title'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});