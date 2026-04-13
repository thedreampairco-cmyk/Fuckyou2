import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAuth } from '../lib/AuthProvider';
import { toast } from 'sonner';
import { Settings, Bell, Lock, Globe } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('Settings saved successfully!');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input defaultValue={user?.displayName || ''} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input defaultValue="(GMT+05:30) India Standard Time" className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <Input defaultValue="English (US)" className="h-11 rounded-xl" />
          </div>
          <Button onClick={handleSave} disabled={loading} className="rounded-xl px-8">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <div>
              <p className="font-bold text-slate-900">Email Notifications</p>
              <p className="text-sm text-slate-500">Receive updates about your orders via email.</p>
            </div>
            <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <div>
              <p className="font-bold text-slate-900">Order Status Updates</p>
              <p className="text-sm text-slate-500">Get notified when your order status changes.</p>
            </div>
            <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
