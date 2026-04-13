import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ShoppingCart, List, Wallet, LifeBuoy, TrendingUp, Clock, CheckCircle2, AlertCircle, User as UserIcon } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../lib/AuthProvider';
import { useCurrency } from '../lib/CurrencyContext';
import axios from 'axios';

interface UserDashboardProps {
  setActiveTab: (tab: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ setActiveTab }) => {
  const { user, profile } = useAuth();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const res = await axios.get('/api/user/orders', {
          headers: { Authorization: user.uid }
        });
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      }
    };
    fetchOrders();
  }, [user]);

  const stats = [
    { label: 'Total Orders', value: orders.length.toString(), icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Completed', value: orders.filter(o => o.status === 'completed').length.toString(), icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Processing', value: orders.filter(o => ['processing', 'pending', 'in_progress'].includes(o.status)).length.toString(), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Canceled', value: orders.filter(o => o.status === 'canceled').length.toString(), icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-linear-to-r from-slate-900 to-slate-800 text-white p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-8 h-8 text-white/50" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl">Welcome back, {profile?.displayName}!</CardTitle>
                  <p className="text-slate-400">Account ID: {profile?.id?.slice(0, 8)}...</p>
                </div>
              </div>
              <p className="text-slate-300">Grow your social presence with our premium SMM services.</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  onClick={() => setActiveTab('new-order')}
                  className="h-16 text-lg gap-3 rounded-2xl"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Place New Order
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab('wallet')}
                  className="h-16 text-lg gap-3 rounded-2xl border-slate-200"
                >
                  <Wallet className="w-5 h-5" />
                  Add Funds
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-xs border border-slate-100">
                          <ShoppingCart className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{order.link}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{order.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">{formatPrice(order.charge)}</p>
                        <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {orders.length > 5 && (
                    <Button variant="ghost" className="w-full text-xs font-bold text-slate-500" onClick={() => setActiveTab('orders')}>
                      View All Orders
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500">No orders found. Start by placing your first order!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-primary text-white">
            <CardHeader>
              <CardTitle className="text-lg">Account Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold mb-6">{formatPrice(profile?.balance || 0)}</p>
              <Button 
                variant="secondary" 
                className="w-full rounded-xl"
                onClick={() => setActiveTab('wallet')}
              >
                Top Up Now
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">Our support team is available 24/7 to assist you with any issues.</p>
              <Button 
                variant="outline" 
                className="w-full rounded-xl gap-2 border-slate-200"
                onClick={() => setActiveTab('support')}
              >
                <LifeBuoy className="w-4 h-4" />
                Open Ticket
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
