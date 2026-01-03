// src/app/admin/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography } from '../../constants/theme';
import { useAppSelector } from '../../store/hooks';

const DEV_ADMIN_BYPASS = __DEV__; // Enable in dev mode only
const DEV_ADMIN_USERNAME = 'admin';
const DEV_ADMIN_PASSWORD = '1234';
const DEV_ADMIN_STORAGE_KEY = 'dev_admin_mode';

export default function AdminLayout() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading:  authLoading } = useAppSelector((state) => state.auth);

  const [devAdminMode, setDevAdminMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isInitialized, setIsInitialized] = useState(false); // Track initialization

  // Check for dev admin mode on mount
  useEffect(() => {
    const checkDevAdminMode = async () => {
      console.log('[Admin] Checking dev admin mode...');

      if (DEV_ADMIN_BYPASS) {
        try {
          const devMode = await AsyncStorage. getItem(DEV_ADMIN_STORAGE_KEY);
          console.log('[Admin] Dev mode from storage:', devMode);

          if (devMode === 'true') {
            setDevAdminMode(true);
          }
        } catch (error) {
          console.error('[Admin] Error checking dev admin mode:', error);
        }
      }

      // Mark as initialized AFTER checking storage
      setIsInitialized(true);
      console.log('[Admin] Initialization complete');
    };

    checkDevAdminMode();
  }, []);

  // Only redirect AFTER initialization is complete
  useEffect(() => {
    console.log('[Admin] Auth check:', {
      isInitialized,
      authLoading,
      devAdminMode,
      isAuthenticated,
      isAdmin,
      DEV_ADMIN_BYPASS
    });

    // Wait for both auth loading AND our initialization
    if (! isInitialized || authLoading) {
      console.log('[Admin] Still loading, not redirecting');
      return;
    }

    // In dev mode, show login form instead of redirecting
    if (DEV_ADMIN_BYPASS) {
      console.log('[Admin] Dev mode enabled, showing login form');
      return; // Don't redirect, show the dev login form
    }

    // In production, redirect if not authenticated admin
    if (!isAuthenticated || !isAdmin) {
      console.log('[Admin] Not authorized, redirecting to settings');
      router.replace('/(tabs)/settings');
    }
  }, [isInitialized, authLoading, isAuthenticated, isAdmin, devAdminMode]);

  const handleDevLogin = async () => {
    console. log('[Admin] Dev login attempt:', username);

    if (username === DEV_ADMIN_USERNAME && password === DEV_ADMIN_PASSWORD) {
      try {
        await AsyncStorage.setItem(DEV_ADMIN_STORAGE_KEY, 'true');
        setDevAdminMode(true);
        setUsername('');
        setPassword('');
        console.log('[Admin] Dev login successful');
      } catch (error) {
        console.error('[Admin] Error saving dev admin mode:', error);
        Alert.alert('خطأ', 'حدث خطأ أثناء تفعيل وضع المطور');
      }
    } else {
      Alert.alert('خطأ', 'اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleDevLogout = async () => {
    try {
      await AsyncStorage.removeItem(DEV_ADMIN_STORAGE_KEY);
      setDevAdminMode(false);
      router.replace('/(tabs)/settings');
    } catch (error) {
      console. error('[Admin] Error removing dev admin mode:', error);
    }
  };

  // Show loading while initializing
  if (! isInitialized || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  // Check if user has access
  const hasAccess = devAdminMode || (isAuthenticated && isAdmin);

  // Show dev login form if in dev mode and no access
  if (DEV_ADMIN_BYPASS && !hasAccess) {
    return (
      <View style={styles.devLoginContainer}>
        <View style={styles.devLoginBox}>
          <Text style={styles.devLoginTitle}>🔧 وضع المطور</Text>
          <Text style={styles.devLoginSubtitle}>تسجيل الدخول للوحة الإدارة</Text>
          <Text style={styles.devLoginHint}>Username: admin | Password: 1234</Text>

          <TextInput
            style={styles.input}
            placeholder="اسم المستخدم (admin)"
            placeholderTextColor={colors.gray[400]}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="كلمة المرور (1234)"
            placeholderTextColor={colors.gray[400]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleDevLogin}>
            <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)/settings')}
          >
            <Text style={styles.backButtonText}>← العودة للإعدادات</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Production mode: show error if no access
  if (! hasAccess) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>🚫 غير مصرح بالوصول</Text>
        <Text style={styles.errorSubtext}>يجب أن تكون مسؤولاً للوصول إلى هذه الصفحة</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/settings')}
        >
          <Text style={styles. backButtonText}>← العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // User has access - show admin dashboard
  return (
    <Stack
      screenOptions={{
        headerShown:  true,
        animation: 'slide_from_right',
        headerStyle: {
          backgroundColor: devAdminMode ? colors.warning : colors.primary,
        },
        headerTintColor:  colors.white,
        headerTitleStyle:  {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: devAdminMode ? '🔧 لوحة التحكم (Dev)' : 'لوحة التحكم الإدارية',
          headerBackTitle: 'عودة',
          headerRight: () => (
            <TouchableOpacity onPress={handleDevLogout} style={styles.devLogoutButton}>
              <Text style={styles.devLogoutText}>خروج</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet. create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText:  {
    marginTop: spacing.md,
    fontSize:  typography.fontSize. md,
    color:  colors.textSecondary,
  },
  devLoginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  devLoginBox:  {
    width: '100%',
    maxWidth: 400,
    backgroundColor:  colors.white,
    borderRadius: 16,
    padding:  spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width:  0, height:  4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation:  8,
  },
  devLoginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.warning,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  devLoginSubtitle: {
    fontSize: typography.fontSize.md,
    color:  colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  devLoginHint:  {
    fontSize:  typography.fontSize.sm,
    color:  colors.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    backgroundColor: colors.primaryLight + '20',
    padding:  spacing.sm,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor:  colors.gray[300],
    borderRadius: 10,
    padding:  spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.fontSize. md,
    backgroundColor:  colors.gray[50],
  },
  loginButton: {
    backgroundColor: colors.warning,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
  },
  backButton:  {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius:  10,
    padding: spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: typography. fontSize.md,
  },
  devLogoutButton: {
    marginRight: spacing.md,
    paddingHorizontal:  spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor:  'rgba(255,255,255,0.2)',
    borderRadius: 6,
  },
  devLogoutText: {
    color: colors.white,
    fontSize:  typography.fontSize.sm,
    fontWeight: 'bold',
  },
  errorContainer:  {
    flex:  1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding:  spacing.xl,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: spacing. sm,
  },
  errorSubtext:  {
    fontSize:  typography.fontSize.md,
    color:  colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing. lg,
  },
});