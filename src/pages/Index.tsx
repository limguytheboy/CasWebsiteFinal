import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import { getProducts } from '@/data/products';
import { Product } from '@/data/types';
import heroBakery from '@/assets/hero-bakery.jpg';

const Index: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      const data = await getProducts();
      setProducts(data);
    };

    loadProducts();
  }, []);

  const featuredProducts = products
    .filter(p => p.featured)
    .slice(0, 4);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section relative overflow-hidden">
        <div className="container relative z-10 py-16 md:py-24 lg:py-32">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
            {/* Content */}
            <div className="text-center lg:text-left">
              <span className="badge-caramel mb-4 inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Handcrafted with Love
              </span>
              <h1 className="text-4xl font-extrabold md:text-5xl lg:text-6xl">
                Sweet Bites, <span className="text-gradient-warm">Happy Hearts</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Artisanal desserts baked fresh by students for our school community.
                Every order supports our CAS journey.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Link to="/products">
                  <Button size="lg" className="rounded-full px-8">
                    Explore Our Treats
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/cas">
                  <Button variant="outline" size="lg" className="rounded-full px-8">
                    Our Story
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="overflow-hidden rounded-3xl shadow-elevated">
                <img
                  src={heroBakery}
                  alt="Bakery"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-2xl bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">100% Fresh</p>
                    <p className="text-sm text-muted-foreground">Baked Daily</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-bakery bg-card">
        <div className="container grid gap-6 md:grid-cols-3">
          {[
            { icon: Heart, title: 'Made with Love', desc: 'Crafted by student bakers' },
            { icon: Sparkles, title: 'Fresh Daily', desc: 'Baked every morning' },
            { icon: Clock, title: 'Easy Pickup', desc: 'During school breaks' },
          ].map((f, i) => (
            <div key={i} className="flex gap-4 rounded-2xl bg-background p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-bakery">
        <div className="container">
          <h2 className="mb-10 text-center text-3xl font-bold">
            Today’s Favorites
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/products">
              <Button variant="outline" size="lg" className="rounded-full px-8">
                View All Treats
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
