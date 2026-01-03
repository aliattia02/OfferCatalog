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
  const { isAuthenticated, isAdmin, loading } = useAppSelector((state) => state.auth);
  const [devAdminMode, setDevAdminMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [checkingDevMode, setCheckingDevMode] = useState(true);

  useEffect(() => {
    // Check for dev admin mode in AsyncStorage
    const checkDevAdminMode = async () => {
      if (DEV_ADMIN_BYPASS) {
        try {
          const devMode = await AsyncStorage.getItem(DEV_ADMIN_STORAGE_KEY);
          setDevAdminMode(devMode === 'true');
        } catch (error) {
          console.error('Error checking dev admin mode:', error);
        }
      }
      setCheckingDevMode(false);
    };

    checkDevAdminMode();
  }, []);

  useEffect(() => {
    // Redirect if not authenticated or not admin (and not in dev mode)
    if (!loading && !checkingDevMode && !devAdminMode && (!isAuthenticated || !isAdmin)) {
      router.replace('/(tabs)/settings');
    }
  }, [isAuthenticated, isAdmin, loading, devAdminMode, checkingDevMode]);

  const handleDevLogin = async () => {
    if (username === DEV_ADMIN_USERNAME && password === DEV_ADMIN_PASSWORD) {
      try {
        await AsyncStorage.setItem(DEV_ADMIN_STORAGE_KEY, 'true');
        setDevAdminMode(true);
        setUsername('');
        setPassword('');
      } catch (error) {
        console.error('Error saving dev admin mode:', error);
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
      console.error('Error removing dev admin mode:', error);
    }
  };

  if (loading || checkingDevMode) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  // Show dev login form if dev mode is enabled and not authenticated
  if (DEV_ADMIN_BYPASS && !devAdminMode && (!isAuthenticated || !isAdmin)) {
    return (
      <View style={styles.devLoginContainer}>
        <View style={styles.devLoginBox}>
          <Text style={styles.devLoginTitle}>وضع المطور - تسجيل الدخول للإدارة</Text>
          <Text style={styles.devLoginSubtitle}>للاختبار المحلي فقط</Text>
          
          <TextInput
            style={styles.input}
            placeholder="اسم المستخدم"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="كلمة المرور"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity style={styles.loginButton} onPress={handleDevLogin}>
            <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/settings')}>
            <Text style={styles.backButtonText}>عودة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!devAdminMode && (!isAuthenticated || !isAdmin)) {
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
          backgroundColor: devAdminMode ? colors.warning : colors.primary,
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
          title: devAdminMode ? 'لوحة التحكم - وضع المطور' : 'لوحة التحكم الإدارية',
          headerBackTitle: 'عودة',
          headerRight: devAdminMode ? () => (
            <TouchableOpacity onPress={handleDevLogout} style={styles.devLogoutButton}>
              <Text style={styles.devLogoutText}>خروج</Text>
            </TouchableOpacity>
          ) : undefined,
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
  devLoginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  devLoginBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  devLoginTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.warning,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  devLoginSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.md,
    textAlign: 'right',
  },
  loginButton: {
    backgroundColor: colors.warning,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
  },
  backButton: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
  },
  devLogoutButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  devLogoutText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
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
