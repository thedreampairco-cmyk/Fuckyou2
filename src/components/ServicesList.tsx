import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Service } from '../types';
import { Search, Filter } from 'lucide-react';
import { useAuth } from '../lib/AuthProvider';
import { useCurrency } from '../lib/CurrencyContext';
import { toast } from 'sonner';
import { Button } from './ui/button';
import axios from 'axios';

const ServicesList: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const { formatPrice } = useCurrency();
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get('/api/services');
        if (Array.isArray(res.data)) {
          setServices(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search services..." 
            className="pl-10 h-11 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1 rounded-full border-slate-200 text-slate-600">
            <Filter className="w-3 h-3 mr-1" />
            All Categories
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold">ID</TableHead>
              <TableHead className="font-bold">Service</TableHead>
              <TableHead className="font-bold">Rate per 1k</TableHead>
              <TableHead className="font-bold">Min/Max</TableHead>
              <TableHead className="font-bold">Features</TableHead>
              <TableHead className="font-bold">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-16 animate-pulse bg-slate-50/50" />
                </TableRow>
              ))
            ) : filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <TableRow key={service.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-mono text-xs text-slate-500">{service.id?.slice(0, 8)}</TableCell>
                  <TableCell>
                    <p className="font-bold text-slate-900">{service.name}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">{service.category}</p>
                  </TableCell>
                  <TableCell className="font-black text-primary">{formatPrice(service.rate)}</TableCell>
                  <TableCell className="text-sm text-slate-600 font-medium">
                    {service.min} / {service.max}
                  </TableCell>
                  <TableCell>
                    {service.dripFeedEnabled && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[10px] font-bold">DRIP-FEED</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-slate-500">
                    {service.description || 'No description'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-slate-500 font-medium">No services found.</p>
                  </div>
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

export default ServicesList;
