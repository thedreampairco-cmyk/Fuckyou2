import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/AuthProvider';
import { toast } from 'sonner';
import { User, Mail, Shield, Key, Copy, RefreshCw, LogOut, Lock } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const generateApiKey = () => {
    const key = 'smm_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    // In a real app, save this to Firestore
    toast.success('New API Key generated!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none">
        <div className="bg-linear-to-br from-primary to-indigo-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.displayName}</h2>
              <p className="text-white/70 text-sm">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
              {profile?.role}
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
              ID: {user?.uid?.slice(0, 8)}
            </span>
          </div>
        </div>

        <div className="p-8 space-y-8 bg-white">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              API Reseller Access
            </h3>
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase font-bold">Your API Key</Label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={profile?.apiKey || 'No API key generated'} 
                  className="bg-slate-50 border-slate-100 font-mono text-xs h-11 rounded-xl"
                />
                <Button variant="outline" size="icon" className="rounded-xl shrink-0" onClick={() => copyToClipboard(profile?.apiKey || '')}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-xl shrink-0" onClick={generateApiKey}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-slate-400">Keep your API key secret. Do not share it with anyone.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Security
            </h3>
            <Button variant="outline" className="w-full justify-start gap-3 rounded-xl border-slate-200 h-12">
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 rounded-xl text-red-500 hover:bg-red-50 h-12"
              onClick={() => {
                signOut(auth);
                onClose();
              }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
