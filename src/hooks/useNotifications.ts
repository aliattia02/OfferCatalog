// src/hooks/useNotifications.ts - Hook to manage notifications
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { initializeNotifications } from '../store/slices/settingsSlice';

/**
 * Hook to initialize and manage notifications
 * Call this in your root component or auth flow
 */
export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { notificationPermission } = useAppSelector((state) => state.settings);

  useEffect(() => {
    // Initialize notifications when user signs in
    if (isAuthenticated && user?.uid && notificationPermission === 'unknown') {
      console.log('🔔 [useNotifications] Initializing notifications for user:', user.uid);
      dispatch(initializeNotifications(user.uid));
    }
  }, [isAuthenticated, user?.uid, notificationPermission, dispatch]);

  return {
    notificationPermission,
  };
};