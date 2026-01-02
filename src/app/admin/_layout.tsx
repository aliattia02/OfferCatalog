// src/app/admin/_layout.tsx
import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';
import { useAppSelector } from '../../store/hooks';

export default function AdminLayout() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.replace('/(tabs)/settings');
    }
  }, [isAuthenticated, isAdmin, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>غير مصرح بالوصول</Text>
        <Text style={styles.errorSubtext}>يجب أن تكون مسؤولاً للوصول إلى هذه الصفحة</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'لوحة التحكم الإدارية',
          headerBackTitle: 'عودة',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: spacing.sm,
  },
  errorSubtext: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
