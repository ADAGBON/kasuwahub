import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from './AuthContext'

/**
 * Guests: cart lives in localStorage (with a product snapshot for display).
 * Signed in: cart lives in MongoDB via /api/cart. On sign-in the guest cart is merged into it.
 * Both modes expose the same shape: items = [{ key, product, qty, size }]
 */
const CartContext = createContext(null)
const GUEST_KEY = 'kasuwahub_guest_cart'

const loadGuest = () => { try { return JSON.parse(localStorage.getItem(GUEST_KEY)) ?? [] } catch { return [] } }
const saveGuest = (items) => { try { localStorage.setItem(GUEST_KEY, JSON.stringify(items)) } catch { /* ignore */ } }

const fromServer = (cart) => cart.items.map((i) => ({ key: i.id, product: i.product, qty: i.qty, size: i.size, available: i.available }))

export function CartProvider({ children }) {
  const { user, ready } = useAuth()
  const [items, setItems] = useState(loadGuest)
  const [syncNote, setSyncNote] = useState('')
  const [loadedFor, setLoadedFor] = useState(null) // id of the user whose server cart is loaded
  const prevUser = useRef(null)
  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items }, [items])

  // Switch storage when auth state changes
  useEffect(() => {
    if (!ready) return
    if (user && prevUser.current?.id !== user.id) {
      const guest = loadGuest()
      const req = guest.length
        ? api('/cart/merge', { method: 'POST', body: { items: guest.map((g) => ({ productId: g.product.id, qty: g.qty, size: g.size })) } })
        : api('/cart')
      req.then((cart) => {
        saveGuest([])
        setItems(fromServer(cart))
        setLoadedFor(user.id)
        if (cart.skipped?.length) setSyncNote(`${cart.skipped.length} item(s) from your guest cart could not be added: ${cart.skipped[0].reason}`)
      }).catch(() => setLoadedFor(user.id))
    } else if (!user && prevUser.current) {
      setItems([]) // signed out
      setLoadedFor(null)
    }
    prevUser.current = user
  }, [user, ready])

  useEffect(() => { if (!user) saveGuest(items) }, [items, user])

  const addItem = useCallback(async (product, qty = 1, size = null) => {
    if (user) {
      setItems(fromServer(await api('/cart/items', { method: 'POST', body: { productId: product.id, qty, size } })))
      return
    }
    const prev = itemsRef.current
    const key = `${product.id}__${size ?? ''}`
    const existing = prev.find((i) => i.key === key)
    const total = (existing?.qty ?? 0) + qty
    if (total > product.stock) throw new Error(product.stock ? `Only ${product.stock} left in stock` : 'Out of stock')
    setItems(existing ? prev.map((i) => (i.key === key ? { ...i, qty: total, product } : i)) : [...prev, { key, product, qty, size }])
  }, [user])

  const updateQty = useCallback(async (key, qty) => {
    if (user) return setItems(fromServer(await api(`/cart/items/${key}`, { method: 'PATCH', body: { qty } })))
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: Math.min(Math.max(i.product.minQty, qty), i.product.stock) } : i)))
  }, [user])

  const removeItem = useCallback(async (key) => {
    if (user) return setItems(fromServer(await api(`/cart/items/${key}`, { method: 'DELETE' })))
    setItems((prev) => prev.filter((i) => i.key !== key))
  }, [user])

  const refresh = useCallback(async () => { if (user) setItems(fromServer(await api('/cart'))) }, [user])

  // true while a signed-in user's server cart hasn't arrived yet
  const syncing = !ready || (Boolean(user) && loadedFor !== user.id)

  const value = useMemo(() => ({
    items, syncing, addItem, updateQty, removeItem, refresh, syncNote, clearSyncNote: () => setSyncNote(''),
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.product.price * i.qty, 0),
  }), [items, syncing, addItem, updateQty, removeItem, refresh, syncNote])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
