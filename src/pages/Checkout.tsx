import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Wallet, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { toast } from 'sonner';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { createOrder } = useOrders();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock card details
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">No items in cart</h1>
        <Link to="/products">
          <Button className="mt-4 rounded-full">Browse Treats</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to place an order');
      navigate('/login?redirect=/checkout');
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const order = createOrder(items, totalPrice, paymentMethod, notes);
    clearCart();
    
    toast.success('Order placed successfully!');
    navigate(`/order-confirmation/${order.id}`);
  };

  return (
    <div className="container py-8 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </button>

      <h1 className="text-3xl font-bold text-foreground">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Checkout Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact Info */}
          {!isAuthenticated && (
            <div className="rounded-2xl bg-muted p-6">
              <p className="text-muted-foreground">
                <Link to="/login?redirect=/checkout" className="font-medium text-primary underline">
                  Sign in
                </Link>{' '}
                to place your order and track your purchases.
              </p>
            </div>
          )}

          {/* Payment Method */}
          <div className="card-bakery">
            <h2 className="text-xl font-bold text-foreground">Payment Method</h2>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as 'card' | 'cash')}
              className="mt-4 space-y-3"
            >
              <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-border p-4 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="card" id="card" />
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Card Payment</p>
                  <p className="text-sm text-muted-foreground">Pay securely with your card</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-border p-4 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="cash" id="cash" />
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Cash on Pickup</p>
                  <p className="text-sm text-muted-foreground">Pay when you collect your order</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Card Details */}
          {paymentMethod === 'card' && (
            <div className="card-bakery">
              <h2 className="text-xl font-bold text-foreground">Card Details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This is a demo. No real payment will be processed.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="input-bakery mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="input-bakery mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="input-bakery mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Notes */}
          <div className="card-bakery">
            <h2 className="text-xl font-bold text-foreground">Order Notes</h2>
            <Textarea
              placeholder="Any special requests or dietary requirements?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-bakery mt-4"
              rows={3}
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl bg-card p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground">Order Summary</h2>
            
            <div className="mt-4 space-y-3">
              {items.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.product.name}
                  </span>
                  <span className="text-foreground">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <hr className="my-4 border-border" />

            <div className="space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full rounded-full"
              disabled={isProcessing || !isAuthenticated}
            >
              {isProcessing ? (
                'Processing...'
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Place Order
                </>
              )}
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              By placing this order, you agree to our terms of service
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
