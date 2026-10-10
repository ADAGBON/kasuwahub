import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'kasuwahub_cart'

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}

// A cart line is unique per product + size (an outfit in M and in L are two lines)
const lineKey = (id, size) => `${id}__${size ?? ''}`

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* storage unavailable */ }
  }, [items])

  const addItem = (product, qty = 1, size = null) => {
    setItems((prev) => {
      const key = lineKey(product.id, size)
      const existing = prev.find((i) => i.key === key)
      if (existing) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i))
      return [...prev, { key, id: product.id, size, qty }]
    })
  }

  const updateQty = (key, qty) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i)))

  const removeItem = (key) => setItems((prev) => prev.filter((i) => i.key !== key))
  const clearCart = () => setItems([])

  const value = useMemo(
    () => ({ items, addItem, updateQty, removeItem, clearCart, count: items.reduce((s, i) => s + i.qty, 0) }),
    [items],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
