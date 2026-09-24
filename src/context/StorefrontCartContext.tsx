import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CartItem, CatalogItem, CatalogItemVariant, CatalogItemAddon } from '../types';
import { resolveItemAction, getCartItemId } from '../utils/itemActionResolver';

interface StorefrontCartContextType {
  businessId: string | null;
  setStorefrontBusinessId: (id: string) => void;
  items: CartItem[];
  addItem: (item: CatalogItem, quantity?: number, variant?: CatalogItemVariant, addons?: CatalogItemAddon[]) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string, variantId?: string) => number;
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
  const activeBizRef = useRef<string | null>(null);

  // Switch store -> immediately load the target business's cart to prevent state race condition
  const setStorefrontBusinessId = (id: string) => {
    if (!id || activeBizRef.current === id) return;

    activeBizRef.current = id;
    setBusinessId(id);
    try {
      const saved = localStorage.getItem(`storelly_cart_${id}`);
      if (saved) {
        const parsed: CartItem[] = JSON.parse(saved);
        // Authoritative enforcement: Cart strictly rejects digital products, consultations, rooms, vehicles and non-cartable items
        const sanitized = parsed.filter(
          (item) => item?.catalogItem && resolveItemAction(item.catalogItem).isCartable && item.quantity > 0
        );
        setItems(sanitized);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.warn('Cart persistence load error:', err);
      setItems([]);
    }
  };

  // Persist cart to localStorage strictly matching the active business ref
  useEffect(() => {
    const currentBiz = activeBizRef.current;
    if (currentBiz && currentBiz === businessId) {
      try {
        // Only persist cartable items
        const cartableItems = items.filter(
          (item) => resolveItemAction(item.catalogItem).isCartable && item.quantity > 0
        );
        localStorage.setItem(`storelly_cart_${currentBiz}`, JSON.stringify(cartableItems));
      } catch (err) {
        console.warn('Cart persistence save error:', err);
      }
    }
  }, [items, businessId]);

  const addItem = (
    catalogItem: CatalogItem,
    quantity = 1,
    variant?: CatalogItemVariant,
    addons: CatalogItemAddon[] = []
  ) => {
    // 1. Authoritative check: Cart must reject digital products, consultations, rooms, vehicles and non-cartable items
    const actionResult = resolveItemAction(catalogItem);
    if (!actionResult.isCartable) {
      console.warn(`[StorefrontCart] Rejected non-cartable item "${catalogItem.name}" (action: ${actionResult.action})`);
      return;
    }

    // 2. Tenant isolation & cart respect for businessId + productId + variantId
    const itemBizId = businessId || catalogItem.businessId;
    if (!itemBizId) {
      console.warn('[StorefrontCart] Cannot add item without businessId');
      return;
    }

    if (businessId && catalogItem.businessId && catalogItem.businessId !== businessId) {
      console.warn(`[StorefrontCart] Item businessId ${catalogItem.businessId} does not match active cart ${businessId}`);
      return;
    }

    const addonKey = addons.map((a) => a.name).sort().join('_');
    const cartItemId = getCartItemId(itemBizId, catalogItem.id, variant?.id, addonKey);

    setItems((prev) => {
      const existing = prev.find((i) => i.id === cartItemId);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty <= 0) {
          return prev.filter((i) => i.id !== cartItemId);
        }
        return prev.map((i) =>
          i.id === cartItemId ? { ...i, quantity: newQty } : i
        );
      }
      if (quantity <= 0) {
        return prev;
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

  const getItemQuantity = (productId: string, variantId?: string): number => {
    const vId = variantId && variantId.trim().length > 0 ? variantId : 'default';
    const match = items.find(
      (item) =>
        item.catalogItem.id === productId &&
        (item.selectedVariant?.id || 'default') === vId
    );
    return match ? match.quantity : 0;
  };

  const totalItemsCount = items
    .filter((item) => resolveItemAction(item.catalogItem).isCartable)
    .reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items
    .filter((item) => resolveItemAction(item.catalogItem).isCartable)
    .reduce((sum, item) => {
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
        getItemQuantity,
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

