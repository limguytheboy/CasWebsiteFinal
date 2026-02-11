import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingBag, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import ProductCard from '@/components/products/ProductCard';
import { Product } from '@/data/types';
import { getProductById } from '@/data/products';

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      const data = await getProductById(id);
      setProduct(data);
      setLoading(false);
    };

    loadProduct();
  }, [id]);

  // ✅ PREVENT WHITE SCREEN
  if (loading) {
    return <div className="container py-20 text-center">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link to="/products">
          <Button className="mt-4 rounded-full">Back to Products</Button>
        </Link>
      </div>
    );
  }

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const allergens = Array.isArray(product.allergens)
    ? product.allergens
    : [];

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${quantity}x ${product.name} added to cart!`);
  };

  return (
    <div className="animate-fade-in">
      <div className="container py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Product */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl shadow-card">
            <img
              src={
                product.image
                  ? product.image.startsWith('http')
                    ? product.image
                    : `/${product.image.replace(/^\/+/, '')}`
                  : '/placeholder.jpg'
              }
              alt={product.name}
              className="aspect-square w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.jpg';
              }}
            />
          </div>

          <div>
            <span className="badge-bakery">{product.category}</span>
            <h1 className="mt-3 text-3xl font-bold">{product.name}</h1>
            <p className="mt-4 text-muted-foreground">{product.description}</p>

            <div className="mt-6 text-3xl font-bold text-primary">
              Rp {Number(product.price)}
            </div>

            {/* ✅ SAFE ALLERGENS */}
            {allergens.length > 0 && (
              <div className="mt-6 flex gap-2 rounded-xl bg-muted p-4">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">
                  Contains: {allergens.join(', ')}
                </p>
              </div>
            )}

            <div className="mt-8 flex gap-4">
              <div className="flex items-center gap-2 rounded-full bg-card p-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus />
                </Button>
                <span className="w-8 text-center font-bold">{quantity}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus />
                </Button>
              </div>

              <Button onClick={handleAddToCart}>
                <ShoppingBag className="mr-2 h-5 w-5" />
                Add — Rp {(Number(product.price) * quantity)}
              </Button>
            </div>
          </div>
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 border-t pt-16">
            <h2 className="mb-8 text-2xl font-bold">You Might Also Like</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
