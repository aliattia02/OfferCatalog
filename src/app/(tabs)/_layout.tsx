import React from 'react';
import { Tabs } from 'expo-router';
import { I18nManager, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors, typography } from '../../constants/theme';
import { useAppSelector } from '../../store/hooks';

export default function TabLayout() {
  const { t } = useTranslation();
  const basketItems = useAppSelector(state => state.basket.items);
  const basketCount = basketItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[200],
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: 'bold',
        },
        headerTitleAlign: 'center',
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
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
