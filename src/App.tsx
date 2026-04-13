import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/AuthProvider';
import { CurrencyProvider, useCurrency } from './lib/CurrencyContext';
import { Toaster } from 'sonner';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  List, 
  Wallet, 
  LifeBuoy, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  ShieldCheck,
  Clock,
  Layers,
  Code2,
  MessageCircle
} from 'lucide-react';
import { Button } from './components/ui/button';
import { cn } from './lib/utils';
import axios from 'axios';
import { auth } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

// Components
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import NewOrder from './components/NewOrder';
import ServicesList from './components/ServicesList';
import OrderHistory from './components/OrderHistory';
import WalletPage from './components/WalletPage';
import SupportTickets from './components/SupportTickets';
import MassOrder from './components/MassOrder';
import ApiDocs from './components/ApiDocs';
import { ProfileModal } from './components/ProfileModal';
import { CurrencySelector } from './components/CurrencySelector';
import { WhatsAppWidget } from './components/WhatsAppWidget';

function AppContent() {
  const { user, profile, loading, isAdmin } = useAuth();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Close sidebar on mobile when tab changes
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, [activeTab]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          balance: 0,
          role: result.user.email === 'av4991986@gmail.com' ? 'admin' : 'user',
          createdAt: serverTimestamp(),
        });
      }

      // Sync with backend (Prisma/SQLite)
      await axios.post('/api/auth/sync', {
        id: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        role: result.user.email === 'av4991986@gmail.com' ? 'admin' : 'user'
      });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Navbar */}
        <nav className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">SMM Pro</span>
          </div>
          <Button onClick={handleLogin} className="rounded-xl px-6">Login / Register</Button>
        </nav>

        {/* Hero Section */}
        <section className="py-20 px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold mb-8 animate-bounce">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            India's #1 Cheapest SMM Panel
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">
            Boost Your Social Presence <br />
            <span className="text-gradient">Instantly & Securely</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
            Get high-quality followers, likes, and views from just ₹17/1000. 
            Trusted by 10,000+ resellers and agencies worldwide.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={handleLogin} size="lg" className="h-14 px-10 text-lg rounded-2xl shadow-xl shadow-primary/20">
              Get Started Now
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-10 text-lg rounded-2xl border-slate-200">
              View Services
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'Ultra-Fast Delivery', desc: 'Orders start processing within seconds of placement.', icon: Clock },
              { title: '24/7 Support', desc: 'Our dedicated team is always here to help you grow.', icon: LifeBuoy },
              { title: 'Secure Payments', desc: 'Pay safely with UPI, Paytm, Crypto, or Stripe.', icon: ShieldCheck }
            ].map((f, i) => (
              <div key={i} className="text-center p-8 rounded-3xl hover:bg-slate-50 transition-colors">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <f.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Services Preview */}
        <section className="py-20 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Best Selling Services</h2>
            <p className="text-slate-500">Premium quality at the lowest prices in the market.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Instagram Followers', rate: '₹17', icon: '📸' },
              { name: 'YouTube Views', rate: '₹85', icon: '🎥' },
              { name: 'TikTok Likes', rate: '₹22', icon: '🎵' },
              { name: 'Facebook Page Likes', rate: '₹45', icon: '👥' }
            ].map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-center">
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{s.name}</h3>
                <p className="text-primary font-bold text-lg">Starting from {s.rate}</p>
                <p className="text-xs text-slate-400 mt-1">per 1000 units</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button variant="link" onClick={handleLogin} className="text-primary font-bold">
              View All 500+ Services →
            </Button>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-8 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">What Our Clients Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Rahul Sharma', role: 'Digital Marketer', text: 'The best panel I have ever used. Rates are incredibly low and delivery is instant.' },
              { name: 'Priya Singh', role: 'Influencer', text: 'Helped me grow my Instagram from 1k to 50k in just 3 months. Highly recommended!' },
              { name: 'Amit Patel', role: 'Agency Owner', text: 'Reliable API and great support. My clients are always happy with the results.' }
            ].map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-slate-600 italic mb-6">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto py-12 bg-slate-900 text-white px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <span className="font-bold text-2xl">SMM Pro</span>
            </div>
            <p className="text-slate-400">© 2026 SMM Pro Panel. All rights reserved.</p>
            <div className="flex gap-6 text-slate-400">
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">API</a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { id: 'new-order', label: 'New Order', icon: ShoppingCart, adminOnly: false },
    { id: 'mass-order', label: 'Mass Order', icon: Layers, adminOnly: false },
    { id: 'services', label: 'Services', icon: List, adminOnly: false },
    { id: 'orders', label: 'My Orders', icon: List, adminOnly: false },
    { id: 'wallet', label: 'Add Funds', icon: Wallet, adminOnly: false },
    { id: 'api-docs', label: 'API Docs', icon: Code2, adminOnly: false },
    { id: 'support', label: 'Support', icon: LifeBuoy, adminOnly: false },
    { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth <= 768 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col",
          "md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 md:translate-x-0 md:w-20"
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl text-slate-900 truncate">SMM Pro</span>}
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                activeTab === item.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-3 mb-2 rounded-xl hover:bg-slate-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-primary transition-all">
              {user.photoURL ? <img src={user.photoURL} alt="" /> : <UserIcon className="w-6 h-6 text-slate-400" />}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.displayName}</p>
                <p className="text-xs text-primary font-bold truncate">{formatPrice(profile?.balance || 0)}</p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-lg font-semibold text-slate-900">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={cn(
                  "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === 'admin' 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
            <CurrencySelector />
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors border border-slate-200 overflow-hidden"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-slate-500" />
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'dashboard' && <UserDashboard setActiveTab={setActiveTab} />}
          {activeTab === 'new-order' && <NewOrder />}
          {activeTab === 'mass-order' && <MassOrder />}
          {activeTab === 'services' && <ServicesList />}
          {activeTab === 'orders' && <OrderHistory />}
          {activeTab === 'wallet' && <WalletPage />}
          {activeTab === 'api-docs' && <ApiDocs />}
          {activeTab === 'support' && <SupportTickets />}
          {activeTab === 'admin' && isAdmin && <AdminDashboard />}
        </div>
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        <WhatsAppWidget />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <AppContent />
        <Toaster position="top-right" richColors />
      </CurrencyProvider>
    </AuthProvider>
  );
}
