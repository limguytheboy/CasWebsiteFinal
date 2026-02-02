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
  created_at: string | null
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
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

export const OrdersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const mapOrderRowToOrder = (row: OrdersRow): Order => {
    const paymentMethod = (row.payment_method ?? 'cash') as Order['paymentMethod']

    return {
      id: row.id,
      userId: row.user_id,
      orderNumber: row.order_number ?? row.id,
      status: row.status,
      total: Number(row.total ?? 0),
      notes: row.notes ?? '',
      paymentMethod,
      deliveryMethod: (row.delivery_method ?? 'pickup') as Order['deliveryMethod'],
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),

      // ✅ REQUIRED by your Order type
      items: [],

      // ✅ REQUIRED by your Order type
      // rule: card/bca = paid, cash = unpaid
      paid: paymentMethod === 'bca',
    }
  }

  const fetchOrders = async () => {
    if (!user) {
      setOrders([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        id,
        user_id,
        order_number,
        status,
        total,
        notes,
        payment_method,
        delivery_method,
        created_at
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .returns<OrdersRow[]>()

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
  }, [user?.id])

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
          notes,

          // only works if columns exist in DB
          address,
          payment_proof_url: paymentProofUrl,
          sender_bank_name: senderBankName,
          sender_account_name: senderAccountName,
        },
      ])
      .select(
        `
        id,
        user_id,
        order_number,
        status,
        total,
        notes,
        payment_method,
        delivery_method,
        created_at
      `
      )
      .single<OrdersRow>()

    if (orderError) throw orderError
    if (!orderRow) throw new Error('Order insert failed')

    const order = mapOrderRowToOrder(orderRow)

    // create order items (based on your table columns)
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

  return (
    <OrdersContext.Provider value={{ orders, loading, fetchOrders, createOrder }}>
      {children}
    </OrdersContext.Provider>
  )
}

export const useOrders = () => {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used inside OrdersProvider')
  return ctx
}
