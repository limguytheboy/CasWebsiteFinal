import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useOrders } from '@/contexts/OrderContext'
import { format } from 'date-fns'
import { ShoppingBag, Clock, CheckCircle, DollarSign, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

const Admin: React.FC = () => {
  const navigate = useNavigate()
  const { profile, loading: authLoading } = useAuth()
  const { orders, updateOrderStatus } = useOrders()

  if (authLoading) return <div className="flex items-center justify-center h-screen text-lg font-bold">Loading...</div>
  if (!profile || profile.role !== 'admin') {
    navigate('/login')
    return null
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const completedOrders = orders.filter(o => o.status === 'completed')
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="container py-8 animate-fade-in">
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-bakery flex gap-2"><ShoppingBag /> {orders.length}</div>
        <div className="card-bakery flex gap-2"><Clock /> {pendingOrders.length}</div>
        <div className="card-bakery flex gap-2"><CheckCircle /> {completedOrders.length}</div>
        <div className="card-bakery flex gap-2"><DollarSign /> RP {totalRevenue}</div>
      </div>

      {/* Orders Table */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{format(order.createdAt, 'MMM d, yyyy')}</td>
                <td>Rp {order.total}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={e => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                    className="rounded-lg border border-border px-2 py-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Admin
