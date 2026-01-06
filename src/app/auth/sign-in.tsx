// src/app/auth/sign-in.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  I18nManager,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import Constants from 'expo-constants';

import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { signInWithGoogle } from '../../store/slices/authSlice';
import { getAuthInstance } from '../../config/firebase';

/**
 * Get Google OAuth client IDs from environment
 */
const getGoogleClientIds = () => {
  return {
    webClientId: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  };
};

export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const clientIds = getGoogleClientIds();

  // Configure Google Sign-In on component mount (Native only)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      configureGoogleSignIn();
    } else {
      // Web doesn't need configuration
      setIsConfigured(true);
    }
  }, []);

  const configureGoogleSignIn = async () => {
    try {
      console.log('🔧 Configuring Google Sign-In for native...');
      console.log('Web Client ID:', clientIds.webClientId);

      GoogleSignin.configure({
        webClientId: clientIds.webClientId,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });

      setIsConfigured(true);
      console.log('✅ Google Sign-In configured successfully');
    } catch (error) {
      console.error('❌ Error configuring Google Sign-In:', error);
      Alert.alert(
        'خطأ في التكوين',
        'فشل تكوين تسجيل الدخول بواسطة Google. يرجى المحاولة مرة أخرى.',
        [{ text: 'موافق' }]
      );
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  /**
   * Handle Google Sign-In for WEB platform
   */
  const handleWebGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      console.log('🌐 Starting Web Google Sign-In...');

      const auth = getAuthInstance();
      const provider = new GoogleAuthProvider();

      // Sign in with popup
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Web sign-in successful:', result.user.email);

      // Get credential
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const idToken = credential?.idToken || null;
      const accessToken = credential?.accessToken || null;

      console.log('🔑 Web tokens obtained');
      console.log('ID Token:', idToken ? 'present' : 'null');
      console.log('Access Token:', accessToken ? 'present' : 'null');

      // Sign in with Firebase using the tokens
      console.log('🔥 Signing in with Firebase...');
      await dispatch(signInWithGoogle({
        idToken,
        accessToken,
      })).unwrap();

      console.log('✅ Sign-in successful, navigation will happen via useEffect');
    } catch (error: any) {
      console.error('❌ Error in web Google sign-in:', error);
      setIsSigningIn(false);

      // Handle popup closed by user
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log('User closed the popup');
        return; // Don't show alert for user cancellation
      }

      let errorMessage = 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.';

      if (error.message?.includes('network') || error.message?.includes('offline')) {
        errorMessage = 'يبدو أنك غير متصل بالإنترنت. يرجى التحقق من الاتصال والمحاولة مرة أخرى.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'تم حظر نافذة تسجيل الدخول. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.';
      }

      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('خطأ في تسجيل الدخول', errorMessage, [{ text: 'موافق' }]);
      }
    }
  };

  /**
   * Handle Google Sign-In for NATIVE platforms (Android/iOS)
   */
  const handleNativeGoogleSignIn = async () => {
    if (!isConfigured) {
      Alert.alert('خطأ', 'جاري تهيئة تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      return;
    }

    try {
      setIsSigningIn(true);
      console.log('🔐 Starting Native Google Sign-In...');

      // Check if Google Play Services are available (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        console.log('✅ Google Play Services available');
      }

      // Sign in and get user info
      console.log('📱 Prompting for Google account...');
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ User signed in:', userInfo.user.email);

      // Get tokens
      console.log('🔑 Getting tokens...');
      const tokens = await GoogleSignin.getTokens();
      console.log('✅ Tokens obtained');
      console.log('ID Token:', tokens.idToken ? 'present' : 'null');
      console.log('Access Token:', tokens.accessToken ? 'present' : 'null');

      // Sign in with Firebase using the tokens
      console.log('🔥 Signing in with Firebase...');
      await dispatch(signInWithGoogle({
        idToken: tokens.idToken || null,
        accessToken: tokens.accessToken || null,
      })).unwrap();

      console.log('✅ Sign-in successful, navigation will happen via useEffect');
    } catch (error: any) {
      console.error('❌ Error in native Google sign-in:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      setIsSigningIn(false);

      // Handle specific error cases
      let errorMessage = 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.';

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the sign-in');
        return; // Don't show alert for user cancellation
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = 'تسجيل الدخول قيد التنفيذ بالفعل';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'خدمات Google Play غير متوفرة أو قديمة. يرجى تحديثها.';
      } else if (error.message?.includes('network') || error.message?.includes('offline')) {
        errorMessage = 'يبدو أنك غير متصل بالإنترنت. يرجى التحقق من الاتصال والمحاولة مرة أخرى.';
      }

      Alert.alert(
        'خطأ في تسجيل الدخول',
        errorMessage,
        [{ text: 'موافق' }]
      );
    }
  };

  /**
   * Main sign-in handler - routes to correct implementation based on platform
   */
  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      await handleWebGoogleSignIn();
    } else {
      await handleNativeGoogleSignIn();
    }
  };

  const handleSkipPress = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="pricetags" size={80} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {I18nManager.isRTL ? 'مرحباً بك في كتالوج العروض' : 'Welcome to Offer Catalog'}
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {I18nManager.isRTL
            ? 'سجل الدخول لحفظ المفضلة والسلة عبر جميع أجهزتك'
            : 'Sign in to save your favorites and basket across all your devices'}
        </Text>

        {/* Google Sign-In Button */}
        <TouchableOpacity
          style={[styles.googleButton, (isSigningIn || loading || !isConfigured) && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={isSigningIn || loading || !isConfigured}
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
            {I18nManager.isRTL ? 'تخطي الآن' : 'Skip for now'}
          </Text>
        </TouchableOpacity>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
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
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
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
    ...shadows.md,
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
    color: colors.primary,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  footer: {
    padding: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});