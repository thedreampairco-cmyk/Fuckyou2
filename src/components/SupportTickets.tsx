import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthProvider';
import { Ticket } from '../types';
import { format } from 'date-fns';
import { LifeBuoy, Plus, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { buttonVariants } from './ui/button';
import { cn } from '@/lib/utils';

const SupportTickets: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket)));
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'tickets'), {
        userId: user.uid,
        subject,
        message,
        status: 'open',
        createdAt: serverTimestamp(),
      });

      toast.success('Ticket created successfully! We will get back to you soon.');
      setSubject('');
      setMessage('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Ticket creation failed:", error);
      toast.error('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Support Tickets</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            className={cn(buttonVariants({ variant: 'default' }), "rounded-xl gap-2")}
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create New Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="e.g. Order #12345 issue" 
                  className="rounded-xl h-11"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea 
                  id="message"
                  className="w-full min-h-[150px] p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Describe your issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl" disabled={loading}>
                {loading ? 'Creating...' : 'Submit Ticket'}
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
              <TableHead>ID</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-xs text-slate-500">{ticket.id?.slice(0, 8)}</TableCell>
                  <TableCell className="font-medium text-slate-900">{ticket.subject}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize px-3 py-1 rounded-full ${
                      ticket.status === 'open' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                      ticket.status === 'answered' ? 'bg-green-50 text-green-600 border-green-100' : 
                      'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {ticket.createdAt?.toDate ? format(ticket.createdAt.toDate(), 'MMM d, yyyy') : 'Just now'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="rounded-lg gap-2">
                      <MessageSquare className="w-4 h-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <LifeBuoy className="w-12 h-12 text-slate-200" />
                    <p>No tickets found. If you have any questions, feel free to contact us!</p>
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

export default SupportTickets;
