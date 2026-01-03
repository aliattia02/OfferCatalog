// src/app/auth/sign-in. tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { signInWithGoogle } from '../../store/slices/authSlice';

// Complete the auth session for web
WebBrowser. maybeCompleteAuthSession();

/**
 * Get Google OAuth client IDs from environment
 */
const getGoogleClientIds = () => {
  return {
    webClientId: Constants.expoConfig?.extra?. EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: Constants.expoConfig?. extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: Constants.expoConfig?. extra?.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    expoClientId: Constants. expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || process.env. EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  };
};

export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const [isSigningIn, setIsSigningIn] = useState(false);

  const clientIds = getGoogleClientIds();

  // Configure Google Sign-In
  const [request, response, promptAsync] = Google. useAuthRequest({
    webClientId: clientIds.webClientId,
    iosClientId: clientIds. iosClientId,
    androidClientId: clientIds.androidClientId,
    expoClientId: clientIds.expoClientId,
  });

  // Handle auth response
  useEffect(() => {
    if (response?. type === 'success') {
      // Debug: Log what we received
      console.log('=== GOOGLE AUTH RESPONSE ===');
      console.log('Response type:', response.type);
      console.log('Response params:', JSON.stringify(response. params, null, 2));
      console.log('============================');

      // Get both tokens - web typically returns access_token, native may return id_token
      const { id_token, access_token } = response. params;

      if (id_token || access_token) {
        handleGoogleSignIn(id_token || null, access_token || null);
      } else {
        console.error('No tokens received from Google');
        setIsSigningIn(false);
        Alert.alert(
          'خطأ في تسجيل الدخول',
          'لم يتم الحصول على رمز المصادقة من Google',
          [{ text: 'موافق' }]
        );
      }
    } else if (response?. type === 'error') {
      console.error('Google auth error:', response.error);
      setIsSigningIn(false);
      Alert.alert(
        'خطأ في تسجيل الدخول',
        'فشل تسجيل الدخول باستخدام Google.  يرجى المحاولة مرة أخرى.',
        [{ text: 'موافق' }]
      );
    } else if (response?.type === 'cancel') {
      console.log('Google auth cancelled');
      setIsSigningIn(false);
    }
  }, [response]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleGoogleSignIn = async (idToken: string | null, accessToken: string | null) => {
    try {
      setIsSigningIn(true);
      console.log('Calling signInWithGoogle with:', {
        idToken:  idToken ?  'present' :  'null',
        accessToken: accessToken ? 'present' : 'null'
      });

      await dispatch(signInWithGoogle({ idToken, accessToken })).unwrap();
      // Navigation handled by useEffect above
    } catch (err:  any) {
      console.error('Error in handleGoogleSignIn:', err);
      setIsSigningIn(false);
      Alert.alert(
        'خطأ في تسجيل الدخول',
        err.message || 'فشل تسجيل الدخول.  يرجى المحاولة مرة أخرى.',
        [{ text: 'موافق' }]
      );
    }
  };

  const handleSignInPress = () => {
    if (! request) {
      Alert.alert('خطأ', 'جاري تهيئة تسجيل الدخول.  يرجى المحاولة مرة أخرى.');
      return;
    }
    setIsSigningIn(true);
    promptAsync();
  };

  const handleSkipPress = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles. iconContainer}>
          <Ionicons name="pricetags" size={80} color={colors. primary} />
        </View>

        {/* Title */}
        <Text style={styles. title}>
          {I18nManager.isRTL ? 'مرحباً بك في كتالوج العروض' : 'Welcome to Offer Catalog'}
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {I18nManager.isRTL
            ? 'سجل الدخول لحفظ المفضلة والسلة عبر جميع أجهزتك'
            :  'Sign in to save your favorites and basket across all your devices'}
        </Text>

        {/* Google Sign-In Button */}
        <TouchableOpacity
          style={[styles.googleButton, (isSigningIn || loading) && styles.buttonDisabled]}
          onPress={handleSignInPress}
          disabled={isSigningIn || loading || !request}
        >
          {isSigningIn || loading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <>
              <Ionicons name="logo-google" size={24} color={colors.text} />
              <Text style={styles.googleButtonText}>
                {I18nManager.isRTL ? 'تسجيل الدخول باستخدام Google' : 'Sign in with Google'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipPress}
          disabled={isSigningIn || loading}
        >
          <Text style={styles.skipButtonText}>
            {I18nManager. isRTL ?  'تخطي الآن' : 'Skip for now'}
          </Text>
        </TouchableOpacity>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors. error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Debug Info (remove in production) */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Web Client ID: {clientIds.webClientId ?  '✓ Set' : '✗ Missing'}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles. footer}>
        <Text style={styles. footerText}>
          {I18nManager.isRTL
            ? 'بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية'
            : 'By continuing, you agree to our Terms of Service and Privacy Policy'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent:  'center',
    alignItems: 'center',
    paddingHorizontal:  spacing.xl,
  },
  iconContainer: {
    width: 120,
    height:  120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing. md,
  },
  subtitle: {
    fontSize: typography. fontSize.md,
    color:  colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing. xxl,
    lineHeight: 24,
  },
  googleButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    width: '100%',
    ... shadows.md,
    gap: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  skipButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  errorContainer:  {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems:  'center',
    backgroundColor: colors.error + '20',
    paddingVertical:  spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    flex: 1,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  debugContainer: {
    marginTop: spacing.lg,
    padding:  spacing.sm,
    backgroundColor:  colors.gray[100],
    borderRadius: borderRadius.sm,
  },
  debugText: {
    fontSize: typography.fontSize. xs,
    color:  colors.textSecondary,
    fontFamily: 'monospace',
  },
  footer: {
    paddingHorizontal:  spacing.xl,
    paddingBottom: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color:  colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});