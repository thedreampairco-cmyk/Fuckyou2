import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../lib/AuthProvider';
import { User, Mail, Shield, Calendar, Wallet } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, profile } = useAuth();

  if (!user || !profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12 text-primary" />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{user.displayName}</h1>
          <p className="text-slate-500 font-medium">{user.email}</p>
          <div className="flex gap-2 mt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              profile.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {profile.role}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-3 border-b border-slate-50">
              <span className="text-slate-500">User ID</span>
              <span className="font-mono text-xs text-slate-900">{user.uid}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-50">
              <span className="text-slate-500">Email Address</span>
              <span className="text-slate-900 font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-50">
              <span className="text-slate-500">Member Since</span>
              <span className="text-slate-900 font-medium">
                {profile.createdAt?.toDate ? profile.createdAt.toDate().toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-3 border-b border-slate-50">
              <span className="text-slate-500">Current Balance</span>
              <span className="text-2xl font-bold text-primary">${profile.balance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-50">
              <span className="text-slate-500">Total Spent</span>
              <span className="text-slate-900 font-medium">$0.00</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-50">
              <span className="text-slate-500">Currency</span>
              <span className="text-slate-900 font-medium">USD</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
