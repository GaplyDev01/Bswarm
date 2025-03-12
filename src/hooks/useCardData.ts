import { useContext } from 'react';
import { CardDataContext, CardDataContextType } from '../contexts/CardDataContext';

export const useCardData = (): CardDataContextType => {
  const context = useContext(CardDataContext);
  
  if (context === undefined) {
    console.error('useCardData must be used within a CardDataProvider');
    // Return a fallback implementation to prevent crashes
    return {
      registerCardData: () => {/* no-op */},
      unregisterCardData: () => {/* no-op */},
      getCardData: () => undefined,
      getAllCardData: () => [],
      getFocusedCardData: () => undefined,
      setFocusedCardId: () => {/* no-op */}
    };
  }
  
  return context;
}; 