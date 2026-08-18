import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, CatalogItem, CatalogItemVariant, CatalogItemAddon } from '../types';

interface StorefrontCartContextType {
  businessId: string | null;
  setStorefrontBusinessId: (id: string) => void;
  items: CartItem[];
  addItem: (item: CatalogItem, quantity?: number, variant?: CatalogItemVariant, addons?: CatalogItemAddon[]) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const StorefrontCartContext = createContext<StorefrontCartContextType | undefined>(undefined);

export const StorefrontCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Switch store -> reset cart if visiting a different business
  const setStorefrontBusinessId = (id: string) => {
    if (businessId && businessId !== id) {
      setItems([]);
    }
    setBusinessId(id);
  };

  const addItem = (
    catalogItem: CatalogItem,
    quantity = 1,
    variant?: CatalogItemVariant,
    addons: CatalogItemAddon[] = []
  ) => {
    const addonKey = addons.map((a) => a.name).sort().join('_');
    const cartItemId = `${catalogItem.id}_${variant?.id || 'default'}_${addonKey || 'none'}`;

    setItems((prev) => {
      const existing = prev.find((i) => i.id === cartItemId);
      if (existing) {
        return prev.map((i) =>
          i.id === cartItemId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          catalogItem,
          quantity,
          selectedVariant: variant,
          selectedAddons: addons,
        },
      ];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    let unitPrice = item.selectedVariant?.price ?? (item.catalogItem.salePrice || item.catalogItem.price);
    if (item.selectedAddons && item.selectedAddons.length > 0) {
      const addonsPrice = item.selectedAddons.reduce((aSum, a) => aSum + a.price, 0);
      unitPrice += addonsPrice;
    }
    return sum + unitPrice * item.quantity;
  }, 0);

  return (
    <StorefrontCartContext.Provider
      value={{
        businessId,
        setStorefrontBusinessId,
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItemsCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </StorefrontCartContext.Provider>
  );
};

export function useStorefrontCart() {
  const context = useContext(StorefrontCartContext);
  if (!context) {
    throw new Error('useStorefrontCart must be used within a StorefrontCartProvider');
  }
  return context;
}
