import { Product } from './types';

import chocolateCake from '@/assets/product-chocolate-cake.jpg';
import cheesecake from '@/assets/product-cheesecake.jpg';
import macarons from '@/assets/product-macarons.jpg';
import croissant from '@/assets/product-croissant.jpg';
import matchaTiramisu from '@/assets/product-matcha-tiramisu.jpg';
import flan from '@/assets/product-flan.jpg';
import cinnamonRoll from '@/assets/product-cinnamon-roll.jpg';
import brownie from '@/assets/product-brownie.jpg';

export const products: Product[] = [
  {
    id: '1',
    name: 'Chocolate Lava Cake',
    description: 'Rich, decadent chocolate cake with a molten caramel center. Handcrafted with Belgian chocolate.',
    price: 8.50,
    category: 'Cakes',
    image: chocolateCake,
    featured: true,
    allergens: ['gluten', 'dairy', 'eggs'],
  },
  {
    id: '2',
    name: 'Strawberry Cheesecake',
    description: 'Creamy New York style cheesecake topped with fresh strawberries and a sweet glaze.',
    price: 7.00,
    category: 'Cakes',
    image: cheesecake,
    featured: true,
    allergens: ['gluten', 'dairy', 'eggs'],
  },
  {
    id: '3',
    name: 'French Macarons (6pc)',
    description: 'Assorted French macarons in matcha, caramel, chocolate, and rose flavors.',
    price: 12.00,
    category: 'Pastries',
    image: macarons,
    featured: true,
    allergens: ['eggs', 'nuts'],
  },
  {
    id: '4',
    name: 'Butter Croissant',
    description: 'Golden, flaky croissant made with premium French butter. Baked fresh every morning.',
    price: 4.50,
    category: 'Pastries',
    image: croissant,
    featured: false,
    allergens: ['gluten', 'dairy', 'eggs'],
  },
  {
    id: '5',
    name: 'Matcha Tiramisu',
    description: 'Japanese-Italian fusion dessert with layers of matcha cream and espresso-soaked ladyfingers.',
    price: 9.00,
    category: 'Desserts',
    image: matchaTiramisu,
    featured: true,
    allergens: ['gluten', 'dairy', 'eggs'],
  },
  {
    id: '6',
    name: 'Caramel Flan',
    description: 'Silky smooth custard pudding with rich caramel sauce. A classic Latin American favorite.',
    price: 6.00,
    category: 'Desserts',
    image: flan,
    featured: false,
    allergens: ['dairy', 'eggs'],
  },
  {
    id: '7',
    name: 'Cinnamon Roll',
    description: 'Warm, soft cinnamon roll with cream cheese frosting. Perfect for breakfast or snack.',
    price: 5.00,
    category: 'Pastries',
    image: cinnamonRoll,
    featured: false,
    allergens: ['gluten', 'dairy', 'eggs'],
  },
  {
    id: '8',
    name: 'Fudge Brownie',
    description: 'Dense, fudgy chocolate brownie topped with walnuts and dusted with powdered sugar.',
    price: 4.00,
    category: 'Desserts',
    image: brownie,
    featured: false,
    allergens: ['gluten', 'dairy', 'eggs', 'nuts'],
  },
];

export const categories = ['All', 'Cakes', 'Pastries', 'Desserts'];
