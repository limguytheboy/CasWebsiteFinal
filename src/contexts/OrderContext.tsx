/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CartItem, Order } from '@/data/types'
import { toast } from 'sonner'

type PaymentMethod = 'bca' | 'cash'
type DeliveryMethod = 'pickup' | 'delivery'

type OrdersRow = {
  id: string
  user_id: string
  order_number: string | null
  status: Order['status']
  total: number | null
  notes: string | null
  payment_method: PaymentMethod | null
  delivery_method: DeliveryMethod | null
  delivery_address: string | null
  payment_proof_url: string | null
  bank_name: string | null
  sender_name: string | null
  created_at: string | null
  paid: boolean | null
}

interface OrdersContextType {
  orders: Order[]
  loading: boolean
  fetchOrders: () => Promise<void>

  createOrder: (
    items: CartItem[],
    total: number,
    paymentMethod: PaymentMethod,
    notes?: string,
    deliveryMethod?: DeliveryMethod,
    address?: string | null,
    paymentProofUrl?: string | null,
    senderBankName?: string | null,
    senderAccountName?: string | null
  ) => Promise<Order>

  updateOrderStatus: (
    orderId: string,
    status: Order['status']
  ) => Promise<void>
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

export const OrdersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const { user, profile } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // ✅ MAP DB -> FRONTEND
  const mapOrderRowToOrder = (row: OrdersRow): Order => {

    const paymentMethod =
      (row.payment_method ?? 'cash') as Order['paymentMethod']

    return {
      id: row.id,
      userId: row.user_id,
      orderNumber: row.order_number ?? row.id,
      status: row.status,
      total: Number(row.total ?? 0),
      notes: row.notes ?? '',
      paymentMethod,
      deliveryMethod:
        (row.delivery_method ?? 'pickup') as Order['deliveryMethod'],
      createdAt: row.created_at
        ? new Date(row.created_at)
        : new Date(),
      items: [],
      paid: row.paid ?? false,
    }
  }

  // ✅ FETCH ORDERS
  const fetchOrders = async () => {

    if (!user) {
      setOrders([])
      setLoading(false)
      return
    }

    setLoading(true)

    let query = supabase
      .from('orders')
      .select(`
        id,
        user_id,
        order_number,
        status,
        total,
        notes,
        payment_method,
        delivery_method,
        delivery_address,
        payment_proof_url,
        bank_name,
        sender_name,
        created_at,
        paid
      `)
      .order('created_at', { ascending: false })

    // ✅ Admin sees ALL orders
    if (profile?.role !== 'admin') {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query.returns<OrdersRow[]>()

    if (error) {
      console.error(error)
      toast.error('Failed to fetch orders')
      setLoading(false)
      return
    }

    setOrders((data ?? []).map(mapOrderRowToOrder))
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.role])

  // ✅ CREATE ORDER
  const createOrder: OrdersContextType['createOrder'] = async (
    items,
    total,
    paymentMethod,
    notes = '',
    deliveryMethod = 'pickup',
    address = null,
    paymentProofUrl = null,
    senderBankName = null,
    senderAccountName = null
  ) => {

    if (!user) throw new Error('Not authenticated')

    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: user.id,
          total,
          status: 'pending',
          payment_method: paymentMethod,
          delivery_method: deliveryMethod,
          delivery_address: address,
          payment_proof_url: paymentProofUrl,
          bank_name: senderBankName,
          sender_name: senderAccountName,
          notes,
          paid: false
        }
      ])
      .select(`
        id,
        user_id,
        order_number,
        status,
        total,
        notes,
        payment_method,
        delivery_method,
        delivery_address,
        payment_proof_url,
        bank_name,
        sender_name,
        created_at,
        paid
      `)
      .single<OrdersRow>()

    if (orderError) throw orderError
    if (!orderRow) throw new Error('Order insert failed')

    const order = mapOrderRowToOrder(orderRow)

    const orderItemsPayload = items.map(ci => ({
      order_id: order.id,
      product_id: ci.product.id,
      quantity: ci.quantity,
      prepared_quantity: 0,
      missing_stock: false,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload)

    if (itemsError) throw itemsError

    await fetchOrders()

    return order
  }

  // ✅ UPDATE STATUS (ADMIN)
  const updateOrderStatus = async (
    orderId: string,
    status: Order['status']
  ) => {

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      console.error(error)
      toast.error('Failed to update order status')
      return
    }

    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, status }
          : order
      )
    )

    toast.success('Order status updated')
  }

  return (
    <OrdersContext.Provider
      value={{
        orders,
        loading,
        fetchOrders,
        createOrder,
        updateOrderStatus
      }}
    >
      {children}
    </OrdersContext.Provider>
  )
}

export const useOrders = () => {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used inside OrdersProvider')
  return ctx
}
