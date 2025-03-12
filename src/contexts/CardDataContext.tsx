import React, { createContext, useState, ReactNode } from 'react';

// Define the shape of card data
export interface CardData {
  id: string;
  title: string;
  data: Record<string, unknown>;
}

// Define the context type
export interface CardDataContextType {
  registerCardData: (id: string, title: string, data: Record<string, unknown>) => void;
  unregisterCardData: (id: string) => void;
  getCardData: (id: string) => CardData | undefined;
  getAllCardData: () => CardData[];
  getFocusedCardData: () => CardData | undefined;
  setFocusedCardId: (id: string | null) => void;
}

// Create the context
export const CardDataContext = createContext<CardDataContextType | undefined>(undefined);

// Create the provider component
export const CardDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cardData, setCardData] = useState<Record<string, CardData>>({});
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);

  // Register card data
  const registerCardData = (id: string, title: string, data: Record<string, unknown>) => {
    setCardData(prev => ({
      ...prev,
      [id]: { id, title, data }
    }));
  };

  // Unregister card data
  const unregisterCardData = (id: string) => {
    setCardData(prev => {
      const newData = { ...prev };
      delete newData[id];
      return newData;
    });
    
    // Clear focused card if it's the one being unregistered
    if (focusedCardId === id) {
      setFocusedCardId(null);
    }
  };

  // Get card data by ID
  const getCardData = (id: string) => cardData[id];

  // Get all card data
  const getAllCardData = () => Object.values(cardData);

  // Get focused card data
  const getFocusedCardData = () => focusedCardId ? cardData[focusedCardId] : undefined;

  return (
    <CardDataContext.Provider
      value={{
        registerCardData,
        unregisterCardData,
        getCardData,
        getAllCardData,
        getFocusedCardData,
        setFocusedCardId
      }}
    >
      {children}
    </CardDataContext.Provider>
  );
}; 