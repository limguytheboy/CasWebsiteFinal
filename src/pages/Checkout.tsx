import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Wallet, ArrowLeft, Lock, Truck, Store, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCart } from '@/contexts/CartContext'
import { useOrders } from '@/contexts/OrderContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const DELIVERY_FEE = 1

const Checkout: React.FC = () => {
  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCart()
  const { createOrder } = useOrders()
  const { user, profile } = useAuth()

  const [paymentMethod, setPaymentMethod] = useState<'bca' | 'cash'>('bca')
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup')

  const [senderBankName, setSenderBankName] = useState('')
  const [senderAccountName, setSenderAccountName] = useState('')

  const [address, setAddress] = useState(profile?.address ?? '')
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const [proofFile, setProofFile] = useState<File | null>(null)

  useEffect(() => {
    if (profile?.address) setAddress(profile.address)
  }, [profile?.address])

  const finalTotal = useMemo(() => {
    return deliveryMethod === 'delivery' ? totalPrice + DELIVERY_FEE : totalPrice
  }, [totalPrice, deliveryMethod])

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">No items in cart</h1>
        <Link to="/products">
          <Button className="mt-4 rounded-full">Browse Treats</Button>
        </Link>
      </div>
    )
  }

  const uploadPaymentProof = async (file: File) => {
    if (!user) throw new Error('Not logged in')

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('payment-proofs').upload(path, file, {
      upsert: true,
      cacheControl: '3600',
    })

    if (error) throw error

    const { data } = supabase.storage.from('payment-proofs').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please sign in to place an order')
      navigate('/login?redirect=/checkout')
      return
    }

    if (!profile?.full_name || !profile?.phone) {
      toast.error('Please complete your profile before ordering')
      navigate('/dashboard/profile')
      return
    }

    if (deliveryMethod === 'delivery' && !address.trim()) {
      toast.error('Delivery address is required')
      return
    }

    if (paymentMethod === 'bca') {
      if (!senderBankName.trim() || !senderAccountName.trim()) {
        toast.error('Please enter sender bank name and sender account name.')
        return
      }
      if (!proofFile) {
        toast.error('Please upload payment proof for BCA transfer')
        return
      }
    }

    try {
      setIsProcessing(true)

      if (deliveryMethod === 'delivery' && address !== (profile.address ?? '')) {
        await supabase.from('profiles').update({ address }).eq('id', user.id)
      }

      let proofUrl: string | null = null
      if (paymentMethod === 'bca' && proofFile) {
        proofUrl = await uploadPaymentProof(proofFile)
      }

      const order = await createOrder(
        items,
        finalTotal,
        paymentMethod,
        notes,
        deliveryMethod,
        deliveryMethod === 'delivery' ? address : null,
        proofUrl,
        paymentMethod === 'bca' ? senderBankName.trim() : null,
        paymentMethod === 'bca' ? senderAccountName.trim() : null
      )

      await clearCart()
      toast.success('Order placed! Waiting for payment verification.')
      navigate(`/order-confirmation/${order.id}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to place order. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <div className="container py-8 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </button>

      <h1 className="text-3xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* LEFT */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card-bakery">
            <h2 className="text-xl font-bold">Delivery Method</h2>

            <RadioGroup
              value={deliveryMethod}
              onValueChange={v => setDeliveryMethod(v as 'pickup' | 'delivery')}
              className="mt-4 space-y-3"
            >
              <label className="flex items-center gap-4 rounded-xl border p-4">
                <RadioGroupItem value="pickup" />
                <Store className="h-5 w-5" />
                Pickup
              </label>

              <label className="flex items-center gap-4 rounded-xl border p-4">
                <RadioGroupItem value="delivery" />
                <Truck className="h-5 w-5" />
                Delivery (+${DELIVERY_FEE})
              </label>
            </RadioGroup>
          </div>

          {deliveryMethod === 'delivery' && (
            <div className="card-bakery">
              <Label>Delivery Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address"
                name="address"
                autoComplete="street-address"
              />
            </div>
          )}

          <div className="card-bakery">
            <h2 className="text-xl font-bold">Payment Method</h2>

            <RadioGroup
              value={paymentMethod}
              onValueChange={v => setPaymentMethod(v as 'bca' | 'cash')}
              className="mt-4 space-y-3"
            >
              <label className="flex items-center gap-4 rounded-xl border p-4">
                <RadioGroupItem value="bca" />
                <Landmark className="h-5 w-5" />
                BCA Transfer (Upload Proof)
              </label>

              <label className="flex items-center gap-4 rounded-xl border p-4">
                <RadioGroupItem value="cash" />
                <Wallet className="h-5 w-5" />
                Cash on Pickup/Delivery
              </label>
            </RadioGroup>

            {paymentMethod === 'bca' && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sender Bank Name
                  </label>
                  <input
                    value={senderBankName}
                    onChange={e => setSenderBankName(e.target.value)}
                    placeholder="ex: BCA / Mandiri / BRI"
                    className="mt-1 w-full rounded-xl border px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sender Account Name
                  </label>
                  <input
                    value={senderAccountName}
                    onChange={e => setSenderAccountName(e.target.value)}
                    placeholder="Name on the bank account"
                    className="mt-1 w-full rounded-xl border px-4 py-3"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'bca' && (
              <div className="mt-4 space-y-2">
                <div className="text-sm text-muted-foreground">
                  Transfer to BCA: <span className="font-semibold">123-456-7890</span> (Your Bakery
                  Name)
                </div>

                <Label>Upload Payment Proof</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={e => setProofFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}
          </div>

          <div className="card-bakery">
            <h2 className="text-xl font-bold">Order Notes</h2>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        {/* RIGHT */}
        <div>
          <div className="sticky top-24 rounded-2xl bg-card p-6">
            <h2 className="text-xl font-bold">Order Summary</h2>

            <div className="mt-4 space-y-3">
              {items.map(item => (
                <div key={item.product.id} className="flex justify-between">
                  <span>
                    {item.quantity}× {item.product.name}
                  </span>
                  <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <hr className="my-4" />

            {deliveryMethod === 'delivery' && (
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>${DELIVERY_FEE.toFixed(2)}</span>
              </div>
            )}

            <div className="mt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>

            <Button type="submit" className="mt-6 w-full rounded-full" disabled={isProcessing}>
              {isProcessing ? (
                'Processing…'
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Place Order
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Checkout
