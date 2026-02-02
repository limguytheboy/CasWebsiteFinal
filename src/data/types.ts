export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string | null
  featured: boolean
  allergens: string[] | null
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Profile {
  id: string
  role: 'user' | 'staff' | 'admin'
  full_name: string | null
  phone: string | null
  address?: string | null
}

export interface OrderItem extends CartItem {
  orderItemId: string
  preparedQuantity: number
  missingStock: boolean
}

export type PaymentMethod = 'cash' | 'bca'

export type BankName = 'bca' | 'mandiri' | 'bni' | 'bri' | 'other'

export type OrderStatus =
  | 'pending'
  | 'pending_verification'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

export type DeliveryMethod = 'pickup' | 'delivery'

export interface Order {
  id: string
  orderNumber: string

  userId: string

  // customer display
  customerName?: string
  customerPhone?: string

  items: OrderItem[]

  total: number
  status: OrderStatus

  createdAt: Date
  notes?: string

  paymentMethod: PaymentMethod
  paid: boolean

  // NEW (for transfer verification)
  bankName?: BankName
  senderName?: string

  // (optional but useful for verification)
  paymentProofUrl?: string
  verifiedBy?: string
  verifiedAt?: Date

  sender_bank_name?: string | null
  sender_account_name?: string | null

  deliveryMethod: DeliveryMethod
  deliveryAddress?: string
}
