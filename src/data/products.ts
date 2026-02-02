import { supabase } from '@/lib/supabase';
import { Product } from './types';
console.log('products.ts LOADED');

/**
 * Fetch all products from Supabase
 */
export async function getProducts(): Promise<Product[]> {
  console.log('getProducts CALLED');

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('PRODUCTS RESULT:', { data, error });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return data as Product;
}

/**
 * Create a new product (ADMIN)
 */
export async function createProduct(product: Omit<Product, 'id'>) {
  return supabase.from('products').insert(product);
}

/**
 * Update a product (ADMIN)
 */
export async function updateProduct(id: string, updates: Partial<Product>) {
  return supabase.from('products').update(updates).eq('id', id);
}

/**
 * Delete a product (ADMIN)
 */
export async function deleteProduct(id: string) {
  return supabase.from('products').delete().eq('id', id);
}
