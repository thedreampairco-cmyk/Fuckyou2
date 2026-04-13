import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthProvider';
import { useCurrency } from '../lib/CurrencyContext';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { Wallet, CreditCard, Landmark, Bitcoin, ArrowUpRight, CheckCircle2, QrCode, Smartphone, Globe, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

const WalletPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { formatPrice } = useCurrency();
  const [amount, setAmount] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('upi_qr');
  const [utr, setUtr] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        const res = await axios.get('/api/user/transactions', {
          headers: { Authorization: user.uid }
        });
        setTransactions(res.data);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      }
    };
    fetchTransactions();
  }, [user]);

  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !utr || amount <= 0) return;
    if (utr.length !== 12) {
      toast.error('UTR must be 12 digits');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/user/transactions', {
        amount,
        type: 'deposit',
        method: 'UPI QR',
        utr
      }, {
        headers: { Authorization: user.uid }
      });
      
      toast.success('UTR submitted! Our system will verify and credit your wallet within 5-10 minutes.');
      setUtr('');
      setAmount(0);
      
      // Refresh transactions
      const res = await axios.get('/api/user/transactions', {
        headers: { Authorization: user.uid }
      });
      setTransactions(res.data);
    } catch (error) {
      toast.error('Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const upiIntent = (app: string) => {
    const vpa = 'smmpro@upi';
    const name = 'SMM Pro Panel';
    const url = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
    window.location.href = url;
    toast.info(`Opening ${app}...`);
  };

  const paymentMethods = [
    { id: 'upi_qr', name: 'UPI QR + UTR', icon: QrCode, desc: 'Scan & Pay (Fastest)' },
    { id: 'upi_intent', name: 'UPI Intent', icon: Smartphone, desc: 'PhonePe, Google Pay, Paytm' },
    { id: 'cards', name: 'Cards', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
    { id: 'paypal', name: 'PayPal', icon: Globe, desc: 'International Users' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Balance Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-2xl bg-linear-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                <Wallet className="w-4 h-4" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-8">
              <p className="text-5xl font-black tracking-tight">{formatPrice(profile?.balance || 0)}</p>
              <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 bg-white/5 p-3 rounded-xl border border-white/10">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                Funds are secured with 256-bit encryption
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods Selector */}
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      selectedMethod === method.id 
                        ? 'bg-primary/10 text-primary shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedMethod === method.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <method.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">{method.name}</p>
                      <p className="text-[10px] opacity-70">{method.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Interface */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-xl bg-white rounded-3xl min-h-[600px] flex flex-col">
            <CardHeader className="border-b border-slate-100 p-8">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900">Add Funds</CardTitle>
                  <p className="text-slate-500 text-sm mt-1">Complete your payment to credit your wallet</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Amount to Pay</p>
                  <p className="text-2xl font-black text-primary">₹{amount || 0}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8 flex-1">
              <div className="max-w-md mx-auto space-y-8">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Enter Amount (INR)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">₹</span>
                    <Input 
                      type="number" 
                      placeholder="500" 
                      className="pl-10 h-16 text-2xl font-bold rounded-2xl border-slate-200 focus:ring-4 focus:ring-primary/10 transition-all"
                      value={amount || ''}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex gap-2">
                    {[100, 500, 1000, 5000].map(val => (
                      <button 
                        key={val}
                        onClick={() => setAmount(val)}
                        className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all"
                      >
                        +₹{val}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {selectedMethod === 'upi_qr' && (
                    <motion.div 
                      key="upi_qr"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center">
                        <div className="w-48 h-48 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=smmpro@upi&pn=SMMPro&am=${amount}&cu=INR`)}`} alt="UPI QR" className="w-full h-full" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Scan with any UPI App</p>
                        <div className="flex gap-4 grayscale opacity-50">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" className="h-4" alt="UPI" />
                          <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" className="h-4" alt="PhonePe" />
                          <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" className="h-4" alt="Paytm" />
                        </div>
                      </div>

                      <form onSubmit={handleUtrSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-bold">12-Digit UTR / Transaction ID</Label>
                          <Input 
                            placeholder="Enter UTR Number" 
                            className="h-12 rounded-xl border-slate-200"
                            value={utr}
                            onChange={(e) => setUtr(e.target.value)}
                            maxLength={12}
                          />
                        </div>
                        <Button type="submit" disabled={loading || !utr || amount <= 0} className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">
                          {loading ? 'Verifying...' : 'Verify & Add Funds'}
                        </Button>
                      </form>
                    </motion.div>
                  )}

                  {selectedMethod === 'upi_intent' && (
                    <motion.div 
                      key="upi_intent"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 gap-4"
                    >
                      <Button onClick={() => upiIntent('PhonePe')} className="h-16 rounded-2xl bg-[#5f259f] hover:bg-[#4a1d7d] text-white font-bold text-lg gap-3">
                        <Smartphone className="w-6 h-6" />
                        Pay with PhonePe
                      </Button>
                      <Button onClick={() => upiIntent('Google Pay')} className="h-16 rounded-2xl bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-900 font-bold text-lg gap-3">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Pay_Logo_%282020%29.svg" className="h-6" alt="GPay" />
                        Pay with Google Pay
                      </Button>
                      <Button onClick={() => upiIntent('Paytm')} className="h-16 rounded-2xl bg-[#00baf2] hover:bg-[#0099cc] text-white font-bold text-lg gap-3">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" className="h-6" alt="Paytm" />
                        Pay with Paytm
                      </Button>
                    </motion.div>
                  )}

                  {selectedMethod === 'cards' && (
                    <motion.div 
                      key="cards"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                        <div className="space-y-2">
                          <Label>Card Number</Label>
                          <Input placeholder="0000 0000 0000 0000" className="h-12 rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Expiry</Label>
                            <Input placeholder="MM/YY" className="h-12 rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label>CVV</Label>
                            <Input placeholder="123" type="password" className="h-12 rounded-xl" />
                          </div>
                        </div>
                      </div>
                      <Button className="w-full h-14 rounded-2xl font-bold text-lg">Pay Securely</Button>
                    </motion.div>
                  )}

                  {selectedMethod === 'paypal' && (
                    <motion.div 
                      key="paypal"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center space-y-6"
                    >
                      <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-12 mx-auto mb-4" alt="PayPal" />
                        <p className="text-sm text-blue-600">International payments will be converted to USD at current rates.</p>
                      </div>
                      <Button className="w-full h-14 rounded-2xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-lg">Checkout with PayPal</Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2 justify-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3" />
                  PCI-DSS Compliant • Secure Gateway
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction History */}
      <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
        <CardHeader className="bg-white border-b border-slate-100 p-6">
          <CardTitle className="text-lg font-bold">Recent Transactions</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>UTR / ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        <ArrowUpRight className={`w-5 h-5 ${tx.type === 'charge' ? 'rotate-90' : ''}`} />
                      </div>
                      <span className="capitalize font-bold text-slate-700">{tx.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className={`font-black text-lg ${tx.type === 'deposit' ? 'text-green-600' : 'text-slate-900'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}{formatPrice(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-500 font-medium">
                      {tx.method || 'Order'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{tx.utr || tx.id?.slice(0, 12)}</TableCell>
                  <TableCell className="text-sm text-slate-500 font-medium">
                    {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), 'MMM d, HH:mm') : 'Just now'}
                  </TableCell>
                  <TableCell>
                    <Badge className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                      tx.status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : 
                      'bg-red-100 text-red-700 hover:bg-red-100'
                    }`}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center gap-4 opacity-20">
                    <Wallet className="w-16 h-16" />
                    <p className="font-bold">No transactions yet</p>
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

export default WalletPage;
