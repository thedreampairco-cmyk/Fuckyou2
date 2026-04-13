import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthProvider';
import { useCurrency } from '../lib/CurrencyContext';
import { Service } from '../types';
import { toast } from 'sonner';
import { ShoppingCart, Info, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

const NewOrder: React.FC = () => {
  const { user, profile } = useAuth();
  const { formatPrice } = useCurrency();
  const [categories, setCategories] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Drip-feed state
  const [isDripFeed, setIsDripFeed] = useState(false);
  const [runs, setRuns] = useState(2);
  const [interval, setInterval] = useState(60);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get('/api/services');
        const servicesData = res.data;
        if (Array.isArray(servicesData)) {
          setServices(servicesData);
          const uniqueCategories = Array.from(new Set(servicesData.map((s: any) => s.category))) as string[];
          setCategories(uniqueCategories);
        }
      } catch (err) {
        console.error('Failed to fetch services:', err);
      }
    };
    fetchServices();
  }, []);

  const filteredServices = services.filter(s => s.category === selectedCategory);

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId) || null;
    setSelectedService(service);
    setIsDripFeed(false);
  };

  const totalQuantity = isDripFeed ? quantity * runs : quantity;
  const totalCharge = selectedService ? (totalQuantity / 1000) * selectedService.rate : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !selectedService) return;

    if (profile.balance < totalCharge) {
      toast.error('Insufficient balance. Please top up your wallet.');
      return;
    }

    if (quantity < selectedService.min || quantity > selectedService.max) {
      toast.error(`Quantity must be between ${selectedService.min} and ${selectedService.max}`);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/orders', {
        serviceId: selectedService.id,
        link,
        quantity,
        isDripFeed,
        runs: isDripFeed ? runs : null,
        interval: isDripFeed ? interval : null
      }, {
        headers: { Authorization: user.uid }
      });

      if (response.data.success) {
        toast.success('Order placed successfully!');
        setLink('');
        setQuantity(0);
        setIsDripFeed(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
          <CardTitle className="flex items-center gap-3 text-2xl font-black text-slate-900">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            New Order
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-slate-700 font-bold">Category</Label>
                <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                  <SelectTrigger className="h-14 rounded-2xl border-slate-200 focus:ring-4 focus:ring-primary/10 transition-all">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-700 font-bold">Service</Label>
                <Select onValueChange={handleServiceChange} disabled={!selectedCategory}>
                  <SelectTrigger className="h-14 rounded-2xl border-slate-200 focus:ring-4 focus:ring-primary/10 transition-all">
                    <SelectValue placeholder="Select Service" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {filteredServices.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - {formatPrice(service.rate)}/1k
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedService && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-slate-50 border-none rounded-2xl">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <Info className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900 mb-1">Service Description</p>
                        <p className="leading-relaxed">{selectedService.description || 'No description available.'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Minimum</p>
                        <p className="font-black text-slate-900">{selectedService.min}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Maximum</p>
                        <p className="font-black text-slate-900">{selectedService.max}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="space-y-3">
              <Label htmlFor="link" className="text-slate-700 font-bold">Link</Label>
              <Input 
                id="link"
                placeholder="https://www.instagram.com/p/..." 
                className="h-14 rounded-2xl border-slate-200 focus:ring-4 focus:ring-primary/10 transition-all"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="quantity" className="text-slate-700 font-bold">Quantity</Label>
              <Input 
                id="quantity"
                type="number" 
                placeholder="Enter quantity" 
                className="h-14 rounded-2xl border-slate-200 focus:ring-4 focus:ring-primary/10 transition-all"
                value={quantity || ''}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            {selectedService?.dripFeedEnabled && (
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-bold text-slate-900">Drip-feed</p>
                      <p className="text-xs text-slate-500">Spread your order over time</p>
                    </div>
                  </div>
                  <Switch checked={isDripFeed} onCheckedChange={setIsDripFeed} />
                </div>

                {isDripFeed && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200"
                  >
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500">Runs</Label>
                      <Input 
                        type="number" 
                        value={runs} 
                        onChange={(e) => setRuns(parseInt(e.target.value) || 1)}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500">Interval (minutes)</Label>
                      <Input 
                        type="number" 
                        value={interval} 
                        onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="col-span-2 text-[10px] text-slate-400 font-medium">
                      Total Quantity: <span className="text-slate-900 font-bold">{totalQuantity}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Total Charge</p>
                <p className="text-4xl font-black text-primary">{formatPrice(totalCharge)}</p>
              </div>
              <Button 
                type="submit" 
                className="w-full sm:w-auto h-14 px-12 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all active:scale-95"
                disabled={loading || !selectedService || quantity <= 0}
              >
                {loading ? 'Processing...' : 'Place Order Now'}
              </Button>
            </div>

            {profile && profile.balance < totalCharge && (
              <div className="flex items-center gap-2 text-red-500 text-sm font-bold justify-center bg-red-50 p-4 rounded-2xl border border-red-100">
                <AlertCircle className="w-5 h-5" />
                Insufficient balance. Please top up your wallet.
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewOrder;
