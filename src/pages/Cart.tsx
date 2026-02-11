import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CartItemComponent from '@/components/cart/CartItem';
import { useCart } from '@/contexts/CartContext';

const Cart: React.FC = () => {
  const { items, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center animate-fade-in">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">
            Looks like you haven't added any treats yet!
          </p>
          <Link to="/products">
            <Button className="mt-6 rounded-full">
              Browse Our Treats
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-foreground">Your Cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map(item => (
              <CartItemComponent key={item.product.id} item={item} />
            ))}
          </div>
          <Button
            variant="ghost"
            className="mt-4 text-muted-foreground"
            onClick={clearCart}
          >
            Clear Cart
          </Button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-card p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground">Order Summary</h2>
            
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>Rp {totalPrice}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span>Rp {totalPrice}</span>
              </div>
            </div>

            <Link to="/checkout" className="mt-6 block">
              <Button size="lg" className="w-full rounded-full">
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Pickup at school during lunch breaks
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
