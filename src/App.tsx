import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Contexts
import { CartProvider } from "./contexts/CartContext";
import { OrdersProvider } from "./contexts/OrderContext";

// Layout
import Layout from "./components/layout/Layout";

// Pages
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderDetail from "./pages/OrderDetail";
import Dashboard from "./pages/Dashboard";
import OrderHistory from "./pages/OrderHistory";
import Profile from "./pages/Profile";
import CAS from "./pages/CAS";
import Admin from "./pages/Admin";
import Staff from "./pages/Staff";
import NotFound from "./pages/NotFound";
import SimpleLogin from "./pages/SimpleLogin";
import PaymentVerification from "./pages/PaymentVerification";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
      <CartProvider>
        <OrdersProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
              <Routes>
                <Route element={<Layout />}>

                  {/* PUBLIC */}
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                  <Route path="/order/:orderId" element={<OrderDetail />} />
                  <Route path="/login" element={<SimpleLogin />} />
                  <Route path="/cas" element={<CAS />} />

                  {/* AUTH CHECKS HAPPEN INSIDE PAGES */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/orders" element={<OrderHistory />} />
                  <Route path="/dashboard/profile" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/staff" element={<Staff />} />
                  <Route path="/staff/payment-verification" element={<PaymentVerification />} />

                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
          </TooltipProvider>
        </OrdersProvider>
      </CartProvider>
  </QueryClientProvider>
);

export default App;
