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
import { useDebounce } from "use-debounce"

const DELIVERY_FEE = 10000

// ✅ ALLOWED DATABASE VALUES
const ALLOWED_BANKS = ['bca','mandiri','bni','bri','other']

const Checkout: React.FC = () => {

  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCart()
  const { createOrder } = useOrders()
  const { user, profile } = useAuth()

  const [paymentMethod, setPaymentMethod] = useState<'bca' | 'cash'>('bca')
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup')

  const [bankName, setBankName] = useState('')
  const [senderName, setSenderName] = useState('')

  const [address, setAddress] = useState(profile?.address ?? '')
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const [proofFile, setProofFile] = useState<File | null>(null)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')

  useEffect(() => {
    if (!profile) return

    setAddress(profile.address ?? '')
    setFullName(profile.full_name ?? '')
    setPhone(profile.phone ?? '')
  }, [profile])


  const finalTotal = useMemo(() => {
    return deliveryMethod === 'delivery'
      ? totalPrice + DELIVERY_FEE
      : totalPrice
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

    const { error } = await supabase.storage
      .from('payment-proofs')
      .upload(path, file, {
        upsert: true,
        cacheControl: '3600',
      })

    if (error) throw error

    const { data } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(path)

    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()

    if (!user) {
      toast.error('Please sign in to place an order')
      navigate('/login?redirect=/checkout')
      return
    }

    if (deliveryMethod === 'delivery' && !address.trim()) {
      toast.error('Delivery address is required')
      return
    }

    if (paymentMethod === 'bca') {
      if (!bankName.trim() || !senderName.trim()) {
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

      if (deliveryMethod === 'delivery' &&
          address !== (profile.address ?? '')) {

        await supabase
          .from('profiles')
          .update({ address })
          .eq('id', user.id)
      }

      let proofUrl: string | null = null

      if (paymentMethod === 'bca' && proofFile) {
        proofUrl = await uploadPaymentProof(proofFile)
      }

      // 🔥 SAFE BANK VALUE FOR DATABASE
      const safeBankName =
        paymentMethod === 'bca'
          ? (ALLOWED_BANKS.includes(bankName.trim().toLowerCase())
              ? bankName.trim().toLowerCase()
              : 'other')
          : null
      
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq('id', user.id)
        .select()
        .single()

      if (updatedProfile) {
        setFullName(updatedProfile.full_name ?? '')
        setPhone(updatedProfile.phone ?? '')
      }

      const order = await createOrder(
        items,
        finalTotal,
        paymentMethod,
        notes,
        deliveryMethod,
        deliveryMethod === 'delivery' ? address : null,
        proofUrl,
        safeBankName,
        paymentMethod === 'bca' ? senderName.trim().toLowerCase() : null
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

        {/* LEFT SIDE — unchanged UI */}

        <div className="space-y-6 lg:col-span-2">
          <div className="card-bakery">
            <h2 className="text-xl font-bold">Contact Information</h2>

            <div className="mt-4 space-y-3">

              <div>
                <Label>Full Name</Label>
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

            </div>
          </div>
          <div className="card-bakery">
            <h2 className="text-xl font-bold">Delivery Method</h2>

            <RadioGroup
              value={deliveryMethod}
              onValueChange={(v: 'pickup' | 'delivery') => setDeliveryMethod(v)}
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
                Delivery (+Rp {DELIVERY_FEE})
              </label>
            </RadioGroup>
          </div>

          {deliveryMethod === 'delivery' && (
            <div className="card-bakery">
              <Label>Please enter specific address with house number (example: Jl. Dago Indah No.89, block/street + number)</Label>
              <Input
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
          )}

          <div className="card-bakery">

            <h2 className="text-xl font-bold">Payment Method</h2>

            <label className="text-xl font-weight 500">BCA: 5222169569, Shannone Glynn</label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v: 'bca' | 'cash') => setPaymentMethod(v)}
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
                Cash
              </label>
            </RadioGroup>

            {paymentMethod === 'bca' && (
              <div className="mt-4 space-y-3">

                <input
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="bca / mandiri / bri / bni"
                  className="mt-1 w-full rounded-xl border px-4 py-3"
                />

                <input
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  placeholder="Sender account name"
                  className="mt-1 w-full rounded-xl border px-4 py-3"
                />

                <label className="mt-2 block">
                  <span className="mb-2 block text-sm">
                    Upload payment proof image
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setProofFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                    id="payment-proof-input"
                  />

                  <label
                    htmlFor="payment-proof-input"
                    className="cursor-pointer rounded-xl border px-4 py-3 inline-block"
                  >
                    {proofFile ? proofFile.name : "Select payment proof image"}
                  </label>
                </label>


              </div>
            )}

          </div>
        </div>

        {/* RIGHT SIDE */}
        <div>

          <div className="sticky top-24 rounded-2xl bg-card p-6">

            <h2 className="text-xl font-bold">Order Summary</h2>

            {items.map(item => (
              <div key={item.product.id} className="flex justify-between">
                <span>{item.quantity}× {item.product.name}</span>
                <span>Rp {(item.product.price * item.quantity)}</span>
              </div>
            ))}

            <hr className="my-4" />

            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>Rp {finalTotal}</span>
            </div>

            <Button type="submit" className="mt-6 w-full rounded-full" disabled={isProcessing}>
              {isProcessing ? 'Processing…' : (
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