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
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import Constants from 'expo-constants';

import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { signInWithGoogle } from '../../store/slices/authSlice';
import { getAuthInstance } from '../../config/firebase';
import { getOrCreateUserProfile } from '../../services/authService';

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
  const [signInMethod, setSignInMethod] = useState<'google' | 'email'>('email'); // Default to email

  // Email/Password form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const clientIds = getGoogleClientIds();

  // Configure Google Sign-In on component mount (Native only)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      configureGoogleSignIn();
    } else {
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
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate password strength
   */
  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  /**
 * Handle Email/Password Sign-In with Auto-Registration
 */
const handleEmailSignIn = async () => {
  // Clear previous errors
  setEmailError('');
  setPasswordError('');

  // Validate inputs
  if (!email.trim()) {
    setEmailError(I18nManager.isRTL ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
    return;
  }

  if (!validateEmail(email)) {
    setEmailError(I18nManager.isRTL ? 'البريد الإلكتروني غير صحيح' : 'Invalid email format');
    return;
  }

  if (!password) {
    setPasswordError(I18nManager.isRTL ? 'يرجى إدخال كلمة المرور' : 'Please enter your password');
    return;
  }

  if (!validatePassword(password)) {
    setPasswordError(I18nManager.isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
    return;
  }

  try {
    setIsSigningIn(true);
    const auth = getAuthInstance();

    console.log('📧 Attempting email sign-in...');

    try {
      // Try to sign in first
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      console.log('✅ Sign-in successful:', userCredential.user.email);

      // Get or create user profile in Firestore
      await getOrCreateUserProfile(userCredential.user);

      // Show success message
      if (Platform.OS === 'web') {
        alert(I18nManager.isRTL ? 'مرحباً بعودتك! تم تسجيل الدخول بنجاح' : 'Welcome back! You have successfully signed in');
      } else {
        Alert.alert(
          I18nManager.isRTL ? 'مرحباً بعودتك!' : 'Welcome back!',
          I18nManager.isRTL ? 'تم تسجيل الدخول بنجاح' : 'You have successfully signed in',
          [{ text: I18nManager.isRTL ? 'موافق' : 'OK' }]
        );
      }

      // Wait a bit for auth state to propagate, then navigate
      setTimeout(() => {
        setIsSigningIn(false);
        router.replace('/(tabs)');
      }, 500);

    } catch (signInError: any) {
      console.log('Sign-in error code:', signInError.code);

      if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
        // User doesn't exist - create new account
        console.log('👤 User not found, creating new account...');

        const newUserCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        console.log('✅ Account created:', newUserCredential.user.email);

        // Update display name (optional - you can ask for this later)
        await updateProfile(newUserCredential.user, {
          displayName: email.split('@')[0], // Use email prefix as default name
        });

        // Create user profile in Firestore
        await getOrCreateUserProfile(newUserCredential.user);

        // Show success message
        if (Platform.OS === 'web') {
          alert(I18nManager.isRTL ? 'مرحباً! تم إنشاء حسابك بنجاح' : 'Welcome! Your account has been created successfully');
        } else {
          Alert.alert(
            I18nManager.isRTL ? 'مرحباً!' : 'Welcome!',
            I18nManager.isRTL ? 'تم إنشاء حسابك بنجاح' : 'Your account has been created successfully',
            [{ text: I18nManager.isRTL ? 'موافق' : 'OK' }]
          );
        }

        // Wait a bit for auth state to propagate, then navigate
        setTimeout(() => {
          setIsSigningIn(false);
          router.replace('/(tabs)');
        }, 500);

      } else if (signInError.code === 'auth/wrong-password') {
        setPasswordError(I18nManager.isRTL ? 'كلمة المرور غير صحيحة' : 'Incorrect password');
        setIsSigningIn(false);
        return;
      } else if (signInError.code === 'auth/invalid-email') {
        setEmailError(I18nManager.isRTL ? 'البريد الإلكتروني غير صحيح' : 'Invalid email format');
        setIsSigningIn(false);
        return;
      } else if (signInError.code === 'auth/email-already-in-use') {
        setEmailError(I18nManager.isRTL ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email already in use');
        setIsSigningIn(false);
        return;
      } else {
        throw signInError;
      }
    }

    console.log('✅ Authentication complete');

  } catch (error: any) {
    console.error('❌ Error in email authentication:', error);
    setIsSigningIn(false);

    let errorMessage = I18nManager.isRTL
      ? 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.'
      : 'Sign-in failed. Please try again.';

    if (error.message?.includes('network') || error.code === 'auth/network-request-failed') {
      errorMessage = I18nManager.isRTL
        ? 'يبدو أنك غير متصل بالإنترنت'
        : 'You appear to be offline';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = I18nManager.isRTL
        ? 'محاولات كثيرة جداً. يرجى المحاولة لاحقاً'
        : 'Too many attempts. Please try again later';
    }

    if (Platform.OS === 'web') {
      alert(errorMessage);
    } else {
      Alert.alert(
        I18nManager.isRTL ? 'خطأ' : 'Error',
        errorMessage,
        [{ text: I18nManager.isRTL ? 'موافق' : 'OK' }]
      );
    }
  }
};

  /**
   * Handle Google Sign-In for WEB platform
   */
  const handleWebGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      console.log('🌐 Starting Web Google Sign-In...');

      const auth = getAuthInstance();
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);
      console.log('✅ Web sign-in successful:', result.user.email);

      const credential = GoogleAuthProvider.credentialFromResult(result);
      const idToken = credential?.idToken || null;
      const accessToken = credential?.accessToken || null;

      await dispatch(signInWithGoogle({
        idToken,
        accessToken,
      })).unwrap();

      console.log('✅ Sign-in successful');
    } catch (error: any) {
      console.error('❌ Error in web Google sign-in:', error);
      setIsSigningIn(false);

      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }

      Alert.alert(
        I18nManager.isRTL ? 'خطأ' : 'Error',
        I18nManager.isRTL ? 'فشل تسجيل الدخول بواسطة Google' : 'Google sign-in failed',
        [{ text: I18nManager.isRTL ? 'موافق' : 'OK' }]
      );
    }
  };

  /**
   * Handle Google Sign-In for NATIVE platforms
   */
  const handleNativeGoogleSignIn = async () => {
    if (!isConfigured) {
      Alert.alert(
        I18nManager.isRTL ? 'خطأ' : 'Error',
        I18nManager.isRTL ? 'جاري تهيئة تسجيل الدخول' : 'Setting up sign-in'
      );
      return;
    }

    try {
      setIsSigningIn(true);
      console.log('📱 Starting Native Google Sign-In...');

      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      await dispatch(signInWithGoogle({
        idToken: tokens.idToken || null,
        accessToken: tokens.accessToken || null,
      })).unwrap();

      console.log('✅ Sign-in successful');
    } catch (error: any) {
      console.error('❌ Error in native Google sign-in:', error);
      setIsSigningIn(false);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      Alert.alert(
        I18nManager.isRTL ? 'خطأ' : 'Error',
        I18nManager.isRTL ? 'فشل تسجيل الدخول بواسطة Google' : 'Google sign-in failed',
        [{ text: I18nManager.isRTL ? 'موافق' : 'OK' }]
      );
    }
  };

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
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

          {/* Sign-In Method Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                signInMethod === 'email' && styles.toggleButtonActive,
              ]}
              onPress={() => setSignInMethod('email')}
            >
              <Ionicons
                name="mail"
                size={20}
                color={signInMethod === 'email' ? colors.white : colors.textSecondary}
              />
              <Text
                style={[
                  styles.toggleText,
                  signInMethod === 'email' && styles.toggleTextActive,
                ]}
              >
                {I18nManager.isRTL ? 'البريد الإلكتروني' : 'Email'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                signInMethod === 'google' && styles.toggleButtonActive,
              ]}
              onPress={() => setSignInMethod('google')}
            >
              <Ionicons
                name="logo-google"
                size={20}
                color={signInMethod === 'google' ? colors.white : colors.textSecondary}
              />
              <Text
                style={[
                  styles.toggleText,
                  signInMethod === 'google' && styles.toggleTextActive,
                ]}
              >
                Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email/Password Form */}
          {signInMethod === 'email' && (
            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder={I18nManager.isRTL ? 'البريد الإلكتروني' : 'Email'}
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign={I18nManager.isRTL ? 'right' : 'left'}
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder={I18nManager.isRTL ? 'كلمة المرور' : 'Password'}
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign={I18nManager.isRTL ? 'right' : 'left'}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

              {/* Info Text */}
              <Text style={styles.infoText}>
                {I18nManager.isRTL
                  ? 'إذا لم يكن لديك حساب، سيتم إنشاؤه تلقائياً'
                  : "Don't have an account? One will be created automatically"}
              </Text>

              {/* Email Sign-In Button */}
              <TouchableOpacity
                style={[styles.signInButton, isSigningIn && styles.buttonDisabled]}
                onPress={handleEmailSignIn}
                disabled={isSigningIn || loading}
              >
                {isSigningIn || loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.signInButtonText}>
                    {I18nManager.isRTL ? 'تسجيل الدخول' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Google Sign-In Button */}
          {signInMethod === 'google' && (
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
                    {I18nManager.isRTL ? 'تسجيل الدخول بواسطة Google' : 'Sign in with Google'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

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
              <Text style={styles.errorMessageText}>{error}</Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
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
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.xl,
    width: '100%',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.white,
  },
  formContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  infoText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  signInButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.white,
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
  errorMessageText: {
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