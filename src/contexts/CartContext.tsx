import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { CartItem, Product } from '@/data/types'
import { useAuth } from '@/contexts/AuthContext'

/* ---------------- CONSTANTS ---------------- */

const LOCAL_CART_KEY = 'bakery-cart'

type LocalCartItem = {
  product: Product
  quantity: number
}

/* ---------------- TYPES ---------------- */

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

/* ---------------- PROVIDER ---------------- */

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])

  /* ---------------- MERGE LOCAL → DB ---------------- */

  const mergeLocalCartToDb = async (): Promise<void> => {
    if (!user) return

    const raw = localStorage.getItem(LOCAL_CART_KEY)
    if (!raw) return

    const localItems: LocalCartItem[] = JSON.parse(raw)
    if (localItems.length === 0) return

    for (const item of localItems) {
      const { data: existing, error: fetchError } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id)
        .eq('product_id', item.product.id)
        .maybeSingle()

      if (fetchError) {
        console.error('Cart merge fetch error:', fetchError)
        continue
      }

      const mergedQuantity =
        (existing?.quantity ?? 0) + item.quantity

      const { error: upsertError } = await supabase
        .from('cart_items')
        .upsert(
          {
            user_id: user.id,
            product_id: item.product.id,
            product: item.product,
            quantity: mergedQuantity,
          },
          { onConflict: 'user_id,product_id' }
        )

      if (upsertError) {
        console.error('Cart merge upsert error:', upsertError)
      }
    }

    localStorage.removeItem(LOCAL_CART_KEY)
  }

  /* ---------------- LOAD CART ---------------- */

  useEffect(() => {
    if (loading) return

    if (!user) {
      setItems([])
      return
    }

    const loadCart = async (): Promise<void> => {
      await mergeLocalCartToDb()

      const { data, error } = await supabase
        .from('cart_items')
        .select('product, quantity')
        .eq('user_id', user.id)

      if (error) {
        console.error('Load cart error:', error)
        return
      }

      const cartItems: CartItem[] = data.map(row => ({
        product: row.product as Product,
        quantity: row.quantity,
      }))

      setItems(cartItems)
    }

    void loadCart()
  }, [user, loading])

  /* ---------------- SAVE LOCAL CART (LOGGED OUT) ---------------- */

  useEffect(() => {
    if (user) return
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items))
  }, [items, user])

  /* ---------------- ADD ---------------- */

  const addToCart = async (
    product: Product,
    quantity = 1
  ): Promise<void> => {
    if (!user) {
      setItems(prev => {
        const existing = prev.find(i => i.product.id === product.id)
        if (existing) {
          return prev.map(i =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        }
        return [...prev, { product, quantity }]
      })
      return
    }

    const existing = items.find(i => i.product.id === product.id)
    const newQuantity = existing
      ? existing.quantity + quantity
      : quantity

    const { error } = await supabase
      .from('cart_items')
      .upsert(
        {
          user_id: user.id,
          product_id: product.id,
          product,
          quantity: newQuantity,
        },
        { onConflict: 'user_id,product_id' }
      )

    if (error) {
      console.error('Add to cart error:', error)
      return
    }

    setItems(prev => {
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: newQuantity }
            : i
        )
      }
      return [...prev, { product, quantity }]
    })
  }

  /* ---------------- UPDATE ---------------- */

  const updateQuantity = async (
    productId: string,
    quantity: number
  ): Promise<void> => {
    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }

    if (!user) {
      setItems(prev =>
        prev.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        )
      )
      return
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', user.id)
      .eq('product_id', productId)

    if (error) {
      console.error('Update quantity error:', error)
      return
    }

    setItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    )
  }

  /* ---------------- REMOVE ---------------- */

  const removeFromCart = async (productId: string): Promise<void> => {
    if (!user) {
      setItems(prev =>
        prev.filter(item => item.product.id !== productId)
      )
      return
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId)

    if (error) {
      console.error('Remove item error:', error)
      return
    }

    setItems(prev =>
      prev.filter(item => item.product.id !== productId)
    )
  }

  /* ---------------- CLEAR ---------------- */

  const clearCart = async (): Promise<void> => {
    if (!user) {
      setItems([])
      localStorage.removeItem(LOCAL_CART_KEY)
      return
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Clear cart error:', error)
      return
    }

    setItems([])
  }

  /* ---------------- TOTALS ---------------- */

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

/* ---------------- HOOK ---------------- */

export function useCart(): CartContextType {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
