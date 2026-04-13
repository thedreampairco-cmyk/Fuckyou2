import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthProvider';
import { Order } from '../types';
import { format } from 'date-fns';
import axios from 'axios';

const OrderHistory: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const res = await axios.get('/api/user/orders', {
          headers: { Authorization: user.uid }
        });
        setOrders(res.data as any);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'canceled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold">ID</TableHead>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Link</TableHead>
              <TableHead className="font-bold">Charge</TableHead>
              <TableHead className="font-bold">Quantity</TableHead>
              <TableHead className="font-bold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-16 animate-pulse bg-slate-50/50" />
                </TableRow>
              ))
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-mono text-xs text-slate-500">{order.id?.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM d, yyyy HH:mm') : 'Just now'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    <a href={order.link} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {order.link}
                    </a>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">${(order.charge / 100).toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-slate-600">{order.quantity}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  </div>
);
};

export default OrderHistory;
