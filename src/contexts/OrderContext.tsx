import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, CartItem } from '@/data/types';

interface OrderContextType {
  orders: Order[];
  createOrder: (items: CartItem[], total: number, paymentMethod: 'card' | 'cash', notes?: string) => Order;
  getOrdersByUser: (userId: string) => Order[];
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getOrder: (orderId: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('bakery-orders');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((order: Order) => ({
        ...order,
        createdAt: new Date(order.createdAt),
        pickupDate: order.pickupDate ? new Date(order.pickupDate) : undefined,
      }));
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('bakery-orders', JSON.stringify(orders));
  }, [orders]);

  const createOrder = (
    items: CartItem[],
    total: number,
    paymentMethod: 'card' | 'cash',
    notes?: string
  ): Order => {
    const userId = JSON.parse(localStorage.getItem('bakery-user') || '{}').id || 'guest';
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      userId,
      items,
      total,
      status: 'pending',
      createdAt: new Date(),
      notes,
      paymentMethod,
    };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const getOrdersByUser = (userId: string) => {
    return orders.filter(order => order.userId === userId);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  const getOrder = (orderId: string) => {
    return orders.find(order => order.id === orderId);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        getOrdersByUser,
        updateOrderStatus,
        getOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
