// components/common/LocationSelector.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setUserLocation, clearUserLocation } from '../../store/slices/settingsSlice';
import {
  governorateNames,
  cityNames,
  getCitiesByGovernorate,
  getGovernorateName,
  getCityName,
  type GovernorateId,
  type CityId,
} from '../../data/stores';

interface LocationSelectorProps {
  showCitySelection?: boolean;
  onLocationChange?: (governorate: GovernorateId, city?: CityId) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  showCitySelection = true,
  onLocationChange,
}) => {
  const dispatch = useAppDispatch();
  const userGovernorate = useAppSelector(state => state.settings.userGovernorate) as GovernorateId | null;
  const userCity = useAppSelector(state => state.settings.userCity) as CityId | null;

  const [showGovernorateModal, setShowGovernorateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  const governorates = Object.keys(governorateNames) as GovernorateId[];
  const availableCities = userGovernorate ? getCitiesByGovernorate(userGovernorate) : [];

  const handleGovernorateSelect = (governorate: GovernorateId) => {
    dispatch(setUserLocation({ governorate, city: null }));
    setShowGovernorateModal(false);
    onLocationChange?.(governorate);
  };

  const handleCitySelect = (city: CityId) => {
    if (userGovernorate) {
      dispatch(setUserLocation({ governorate: userGovernorate, city }));
      setShowCityModal(false);
      onLocationChange?.(userGovernorate, city);
    }
  };

  const handleClearLocation = () => {
    dispatch(clearUserLocation());
    onLocationChange?.(null as any);
  };

  const getDisplayText = () => {
    if (!userGovernorate) return 'اختر موقعك';
    
    const govName = getGovernorateName(userGovernorate);
    if (userCity) {
      const cityName = getCityName(userCity);
      return `${cityName}، ${govName}`;
    }
    
    return govName;
  };

  return (
    <View style={styles.container}>
      {/* Location Display */}
      <View style={styles.locationDisplay}>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setShowGovernorateModal(true)}
        >
          <Ionicons name="location" size={20} color={colors.primary} />
          <Text style={styles.locationText}>{getDisplayText()}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
        </TouchableOpacity>

        {userGovernorate && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearLocation}
          >
            <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* City Selection Button */}
      {showCitySelection && userGovernorate && availableCities.length > 0 && (
        <TouchableOpacity
          style={styles.cityButton}
          onPress={() => setShowCityModal(true)}
        >
          <Ionicons name="business" size={16} color={colors.textSecondary} />
          <Text style={styles.cityButtonText}>
            {userCity ? getCityName(userCity) : 'اختر المدينة (اختياري)'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.gray[400]} />
        </TouchableOpacity>
      )}

      {/* Governorate Selection Modal */}
      <Modal
        visible={showGovernorateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGovernorateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGovernorateModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر المحافظة</Text>
              <TouchableOpacity onPress={() => setShowGovernorateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {governorates.map((gov) => (
                <TouchableOpacity
                  key={gov}
                  style={[
                    styles.modalItem,
                    userGovernorate === gov && styles.modalItemActive,
                  ]}
                  onPress={() => handleGovernorateSelect(gov)}
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color={userGovernorate === gov ? colors.primary : colors.gray[400]}
                  />
                  <Text
                    style={[
                      styles.modalItemText,
                      userGovernorate === gov && styles.modalItemTextActive,
                    ]}
                  >
                    {governorateNames[gov].ar}
                  </Text>
                  {userGovernorate === gov && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* City Selection Modal */}
      <Modal
        visible={showCityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCityModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCityModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر المدينة</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  !userCity && styles.modalItemActive,
                ]}
                onPress={() => {
                  if (userGovernorate) {
                    dispatch(setUserLocation({ governorate: userGovernorate, city: null }));
                  }
                  setShowCityModal(false);
                }}
              >
                <Ionicons
                  name="apps"
                  size={20}
                  color={!userCity ? colors.primary : colors.gray[400]}
                />
                <Text
                  style={[
                    styles.modalItemText,
                    !userCity && styles.modalItemTextActive,
                  ]}
                >
                  كل المدن
                </Text>
                {!userCity && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {availableCities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.modalItem,
                    userCity === city && styles.modalItemActive,
                  ]}
                  onPress={() => handleCitySelect(city)}
                >
                  <Ionicons
                    name="business"
                    size={20}
                    color={userCity === city ? colors.primary : colors.gray[400]}
                  />
                  <Text
                    style={[
                      styles.modalItemText,
                      userCity === city && styles.modalItemTextActive,
                    ]}
                  >
                    {cityNames[city].ar}
                  </Text>
                  {userCity === city && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  locationDisplay: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationButton: {
    flex: 1,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[300],
    gap: spacing.sm,
  },
  locationText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: '500',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  clearButton: {
    padding: spacing.xs,
  },
  cityButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  cityButtonText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  modalItemActive: {
    backgroundColor: colors.primaryLight + '10',
  },
  modalItemText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  modalItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default LocationSelector;
