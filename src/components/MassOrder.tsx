import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

const MassOrder: React.FC = () => {
  const [orders, setOrders] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orders.trim()) {
      toast.error('Please enter at least one order');
      return;
    }

    setLoading(true);
    // Simulate processing
    setTimeout(() => {
      toast.success('Mass orders submitted successfully!');
      setOrders('');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Layers className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mass Order</h1>
          <p className="text-slate-500">Place hundreds of orders at once</p>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            Enter one order per line in the following format:
          </p>
          <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs mb-4">
            service_id | link | quantity <br />
            service_id | link | quantity <br />
            service_id | link | quantity
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Example: 102 | https://instagram.com/p/abc | 1000
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label className="text-slate-700 font-bold">Orders List</Label>
          <textarea
            value={orders}
            onChange={(e) => setOrders(e.target.value)}
            placeholder="102 | https://instagram.com/p/abc | 1000"
            className="w-full min-h-[300px] p-6 rounded-3xl border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm bg-white shadow-sm"
          />
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20"
        >
          {loading ? 'Processing Orders...' : 'Submit Mass Orders'}
        </Button>
      </form>
    </div>
  );
};

export default MassOrder;
