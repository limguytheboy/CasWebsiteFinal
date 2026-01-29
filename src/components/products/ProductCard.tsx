import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Product } from '@/data/types';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="card-product">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {product.featured && (
            <span className="absolute left-3 top-3 badge-caramel">
              Featured
            </span>
          )}
          <Button
            onClick={handleAddToCart}
            size="icon"
            className="absolute bottom-3 right-3 h-10 w-10 rounded-full opacity-0 shadow-lg transition-all group-hover:opacity-100"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {product.category}
          </span>
          <h3 className="mt-1 text-lg font-bold text-foreground">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {product.description}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xl font-bold text-primary">
              ${product.price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
