// src/hooks/useBasketLimit.ts
import { Alert } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { removeExpiredItems } from '../store/slices/basketSlice';
import { isDateExpired } from '../utils/dateUtils';

const BASKET_LIMIT = 50;

export const useBasketLimit = () => {
  const dispatch = useAppDispatch();
  const basketItems = useAppSelector(state => state.basket.items);

  const checkBasketLimit = (): boolean => {
    if (basketItems.length >= BASKET_LIMIT) {
      const expiredCount = basketItems.filter(item => 
        item.offerEndDate && isDateExpired(item.offerEndDate)
      ).length;

      if (expiredCount > 0) {
        // Show alert with option to remove expired items
        Alert.alert(
          'السلة ممتلئة',
          `وصلت إلى الحد الأقصى (${BASKET_LIMIT} عنصر).\n\nلديك ${expiredCount} ${expiredCount === 1 ? 'عنصر منتهي' : 'عنصر منتهي'}. هل تريد حذفها لإضافة عناصر جديدة؟`,
          [
            {
              text: 'إلغاء',
              style: 'cancel'
            },
            {
              text: `حذف العناصر المنتهية (${expiredCount})`,
              style: 'destructive',
              onPress: () => {
                dispatch(removeExpiredItems());
                Alert.alert('تم', 'تم حذف العناصر المنتهية. يمكنك الآن إضافة عناصر جديدة.');
              }
            }
          ]
        );
      } else {
        // No expired items, just show limit reached
        Alert.alert(
          'السلة ممتلئة',
          `وصلت إلى الحد الأقصى (${BASKET_LIMIT} عنصر).\n\nاحذف بعض العناصر لإضافة عناصر جديدة.`,
          [{ text: 'حسناً' }]
        );
      }
      
      return false; // Limit reached
    }

    return true; // Can add more items
  };

  return {
    checkBasketLimit,
    basketLimit: BASKET_LIMIT,
    currentCount: basketItems.length,
    isAtLimit: basketItems.length >= BASKET_LIMIT,
  };
};
