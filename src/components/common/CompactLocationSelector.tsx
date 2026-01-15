// components/common/CompactLocationSelector.tsx
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
  getGovernorateName,
  type GovernorateId,
} from '../../data/stores';

interface CompactLocationSelectorProps {
  onLocationChange?: (governorate: GovernorateId | null) => void;
}

export const CompactLocationSelector: React.FC<CompactLocationSelectorProps> = ({
  onLocationChange,
}) => {
  const dispatch = useAppDispatch();
  const userGovernorate = useAppSelector(state => state.settings.userGovernorate) as GovernorateId | null;

  const [showModal, setShowModal] = useState(false);

  const governorates = Object.keys(governorateNames) as GovernorateId[];

  const handleGovernorateSelect = (governorate: GovernorateId) => {
    dispatch(setUserLocation({ governorate, city: null }));
    setShowModal(false);
    onLocationChange?.(governorate);
  };

  const handleClearLocation = () => {
    dispatch(clearUserLocation());
    setShowModal(false);
    onLocationChange?.(null);
  };

  const getDisplayText = () => {
    if (!userGovernorate) return 'كل المحافظات';
    return getGovernorateName(userGovernorate);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="location" 
          size={18} 
          color={userGovernorate ? colors.primary : colors.textSecondary} 
        />
        <Text 
          style={[
            styles.text,
            userGovernorate && styles.textActive
          ]}
          numberOfLines={1}
        >
          {getDisplayText()}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={16} 
          color={colors.gray[400]} 
        />
      </TouchableOpacity>

      {/* Governorate Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر المحافظة</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {/* All Governorates Option */}
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  !userGovernorate && styles.modalItemActive,
                ]}
                onPress={handleClearLocation}
              >
                <Ionicons
                  name="apps"
                  size={20}
                  color={!userGovernorate ? colors.primary : colors.gray[400]}
                />
                <Text
                  style={[
                    styles.modalItemText,
                    !userGovernorate && styles.modalItemTextActive,
                  ]}
                >
                  كل المحافظات
                </Text>
                {!userGovernorate && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* Individual Governorates */}
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
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray[300],
    gap: spacing.xs,
    minWidth: 140,
    maxWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  textActive: {
    color: colors.primary,
    fontWeight: '600',
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
    maxHeight: '70%',
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

export default CompactLocationSelector;
