import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Service, Order, UserProfile, Ticket } from '../types';
import { Plus, Edit, Trash2, Users, ShoppingCart, List, LifeBuoy, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { buttonVariants } from './ui/button';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useAuth } from '../lib/AuthProvider';

const AdminDashboard: React.FC = () => {
  const { user: authUser } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Service Form State
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState<Partial<Service>>({
    name: '',
    category: '',
    rate: 0,
    min: 100,
    max: 10000,
    description: '',
    active: true,
    providerId: '',
    externalServiceId: ''
  });

  // Provider Form State
  const [editingProvider, setEditingProvider] = useState<any | null>(null);
  const [providerForm, setProviderForm] = useState({
    name: '',
    apiUrl: '',
    apiKey: ''
  });

  useEffect(() => {
    const fetchBackendData = async () => {
      if (!authUser) return;
      const config = { headers: { Authorization: authUser.uid } };
      try {
        const [providersRes, servicesRes, ordersRes, transactionsRes] = await Promise.all([
          axios.get('/api/admin/providers', config),
          axios.get('/api/admin/services', config),
          axios.get('/api/admin/orders', config),
          axios.get('/api/admin/transactions', config)
        ]);
        if (Array.isArray(providersRes.data)) setProviders(providersRes.data);
        if (Array.isArray(servicesRes.data)) setServices(servicesRes.data);
        if (Array.isArray(ordersRes.data)) setOrders(ordersRes.data as any);
        if (Array.isArray(transactionsRes.data)) setTransactions(transactionsRes.data);
      } catch (err) {
        console.error('Failed to fetch backend data:', err);
      }
    };

    fetchBackendData();

    const unsubTickets = onSnapshot(query(collection(db, 'tickets'), orderBy('createdAt', 'desc')), (snap) => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Ticket)));
    });

    setLoading(false);
    return () => {
      unsubTickets();
    };
  }, [authUser]);

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    const config = { headers: { Authorization: authUser.uid } };
    try {
      const data = {
        name: serviceForm.name,
        categoryId: serviceForm.category, // Backend expects categoryId
        rate: Math.round(Number(serviceForm.rate) * 100), // Convert to Paise
        min: Number(serviceForm.min),
        max: Number(serviceForm.max),
        description: serviceForm.description,
        providerId: serviceForm.providerId || null,
        upstreamServiceId: serviceForm.externalServiceId || null
      };

      if (editingService) {
        await axios.put(`/api/admin/services/${editingService.id}`, data, config);
        toast.success('Service updated');
      } else {
        await axios.post('/api/admin/services', data, config);
        toast.success('Service added');
      }
      
      // Refresh services
      const res = await axios.get('/api/admin/services', config);
      setServices(res.data);
      
      setEditingService(null);
      setServiceForm({ name: '', category: '', rate: 0, min: 100, max: 10000, description: '', active: true, providerId: '', externalServiceId: '' });
    } catch (error) {
      toast.error('Failed to save service');
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    const config = { headers: { Authorization: authUser.uid } };
    try {
      if (editingProvider) {
        await axios.put(`/api/admin/providers/${editingProvider.id}`, providerForm, config);
        toast.success('Provider updated');
      } else {
        await axios.post('/api/admin/providers', providerForm, config);
        toast.success('Provider added');
      }
      
      // Refresh providers
      const res = await axios.get('/api/admin/providers', config);
      setProviders(res.data);
      
      setEditingProvider(null);
      setProviderForm({ name: '', apiUrl: '', apiKey: '' });
    } catch (error) {
      toast.error('Failed to save provider');
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!authUser) return;
    if (window.confirm('Are you sure?')) {
      const config = { headers: { Authorization: authUser.uid } };
      await axios.delete(`/api/admin/providers/${id}`, config);
      setProviders(providers.filter(p => p.id !== id));
      toast.success('Provider deleted');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      await deleteDoc(doc(db, 'services', id));
      toast.success('Service deleted');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    if (!authUser) return;
    const config = { headers: { Authorization: authUser.uid } };
    try {
      await axios.put(`/api/admin/orders/${orderId}`, { status }, config);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: status as any } : o));
      toast.success('Order status updated');
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleApproveTransaction = async (txId: string) => {
    if (!authUser) return;
    const config = { headers: { Authorization: authUser.uid } };
    try {
      await axios.post(`/api/admin/transactions/${txId}/approve`, {}, config);
      setTransactions(transactions.map(tx => tx.id === txId ? { ...tx, status: 'completed' } : tx));
      toast.success('Transaction approved and balance credited');
    } catch (error) {
      toast.error('Failed to approve transaction');
    }
  };

  const handleSeedData = async () => {
    if (!authUser) return;
    const config = { headers: { Authorization: authUser.uid } };
    try {
      await axios.post('/api/admin/seed', {}, config);
      toast.success('Initial services seeded successfully!');
      // Refresh services
      const res = await axios.get('/api/admin/services', config);
      setServices(res.data);
    } catch (error) {
      toast.error('Failed to seed data');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-900">Admin Control Panel</h2>
        <Button variant="outline" onClick={handleSeedData} className="rounded-xl border-slate-200">
          Seed Initial Data
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
              <List className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Services</p>
              <p className="text-2xl font-bold text-slate-900">{services.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
              <LifeBuoy className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Open Tickets</p>
              <p className="text-2xl font-bold text-slate-900">{tickets.filter(t => t.status === 'open').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <TabsList className="bg-white p-1 rounded-xl border border-slate-200 inline-flex min-w-max md:flex md:min-w-0">
            <TabsTrigger value="orders" className="rounded-lg px-6">Orders</TabsTrigger>
            <TabsTrigger value="services" className="rounded-lg px-6">Services</TabsTrigger>
            <TabsTrigger value="providers" className="rounded-lg px-6">Providers</TabsTrigger>
            <TabsTrigger value="transactions" className="rounded-lg px-6">Transactions</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg px-6">Users</TabsTrigger>
            <TabsTrigger value="tickets" className="rounded-lg px-6">Tickets</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="orders">
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Charge</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id?.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{(order as any).user?.email || order.userId}</TableCell>
                      <TableCell className="text-sm">{(order as any).service?.name || order.serviceId}</TableCell>
                      <TableCell className="font-bold">${(order.charge / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{order.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <select 
                          className="text-xs border rounded p-1"
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="canceled">Canceled</option>
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-lg font-bold">Manage Services</h3>
            <Dialog onOpenChange={(open) => !open && setEditingService(null)}>
              <DialogTrigger
                className={cn(buttonVariants({ variant: 'default' }), "rounded-xl gap-2")}
              >
                <Plus className="w-4 h-4" />
                Add Service
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveService} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Service Name</Label>
                    <Input 
                      value={serviceForm.name} 
                      onChange={e => setServiceForm({...serviceForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input 
                        value={serviceForm.category} 
                        onChange={e => setServiceForm({...serviceForm, category: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rate per 1k ($)</Label>
                      <Input 
                        type="number" step="0.01"
                        value={serviceForm.rate} 
                        onChange={e => setServiceForm({...serviceForm, rate: parseFloat(e.target.value)})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Quantity</Label>
                      <Input 
                        type="number"
                        value={serviceForm.min} 
                        onChange={e => setServiceForm({...serviceForm, min: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Quantity</Label>
                      <Input 
                        type="number"
                        value={serviceForm.max} 
                        onChange={e => setServiceForm({...serviceForm, max: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Provider (Optional)</Label>
                      <select 
                        className="w-full h-10 border rounded-xl px-3 text-sm"
                        value={serviceForm.providerId}
                        onChange={e => setServiceForm({...serviceForm, providerId: e.target.value})}
                      >
                        <option value="">Manual / No Provider</option>
                        {providers.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Upstream Service ID</Label>
                      <Input 
                        placeholder="e.g. 102"
                        value={serviceForm.externalServiceId} 
                        onChange={e => setServiceForm({...serviceForm, externalServiceId: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <textarea 
                      className="w-full border rounded-xl p-2 min-h-[100px]"
                      value={serviceForm.description} 
                      onChange={e => setServiceForm({...serviceForm, description: e.target.value})}
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-xl">
                    <Save className="w-4 h-4 mr-2" />
                    Save Service
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map(service => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{service.category}</TableCell>
                      <TableCell className="font-bold">${service.rate.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={service.active ? 'default' : 'secondary'}>
                          {service.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingService(service);
                          setServiceForm(service);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteService(service.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-lg font-bold">Upstream Providers</h3>
            <Dialog onOpenChange={(open) => !open && setEditingProvider(null)}>
              <DialogTrigger className={cn(buttonVariants({ variant: 'default' }), "rounded-xl gap-2")}>
                <Plus className="w-4 h-4" />
                Add Provider
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingProvider ? 'Edit Provider' : 'Add New Provider'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveProvider} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Provider Name</Label>
                    <Input 
                      placeholder="e.g. LuvSMM"
                      value={providerForm.name} 
                      onChange={e => setProviderForm({...providerForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API URL</Label>
                    <Input 
                      placeholder="https://provider.com/api/v2"
                      value={providerForm.apiUrl} 
                      onChange={e => setProviderForm({...providerForm, apiUrl: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input 
                      type="password"
                      placeholder="Your API Key"
                      value={providerForm.apiKey} 
                      onChange={e => setProviderForm({...providerForm, apiKey: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-xl">
                    <Save className="w-4 h-4 mr-2" />
                    Save Provider
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>API URL</TableHead>
                    <TableHead>Linked Services</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map(provider => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-bold">{provider.name}</TableCell>
                      <TableCell className="text-sm text-slate-500">{provider.apiUrl}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {services.filter(s => s.providerId === provider.id).length} Services
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingProvider(provider);
                          setProviderForm({ name: provider.name, apiUrl: provider.apiUrl, apiKey: provider.apiKey });
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteProvider(provider.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>UTR / ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">{tx.user?.email}</TableCell>
                      <TableCell className="font-bold">${(tx.amount / 100).toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{tx.method}</TableCell>
                      <TableCell className="font-mono text-xs">{tx.utr || tx.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>{tx.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.status === 'pending' && (
                          <Button size="sm" onClick={() => handleApproveTransaction(tx.id)}>Approve</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell className="font-bold">${user.balance.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
