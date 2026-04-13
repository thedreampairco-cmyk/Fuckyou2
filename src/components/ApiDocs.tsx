import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Code2, Copy, Terminal, Globe, Shield } from 'lucide-react';
import { toast } from 'sonner';

const ApiDocs: React.FC = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const endpoints = [
    { name: 'Add Order', method: 'POST', action: 'add', params: ['service', 'link', 'quantity', 'runs (optional)', 'interval (optional)'] },
    { name: 'Status', method: 'POST', action: 'status', params: ['order'] },
    { name: 'Multi Status', method: 'POST', action: 'status', params: ['orders (comma separated)'] },
    { name: 'Services', method: 'POST', action: 'services', params: [] },
    { name: 'Balance', method: 'POST', action: 'balance', params: [] },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Code2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">API Documentation</h1>
          <p className="text-slate-500">Connect your panel to our high-speed supplier API</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-linear-to-br from-slate-900 to-slate-800 text-white">
          <CardContent className="p-6 space-y-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold">API URL</h3>
            <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
              <code className="text-xs">https://smmpro.com/api/v2</code>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => copyToClipboard('https://smmpro.com/api/v2')}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-linear-to-br from-primary to-indigo-600 text-white">
          <CardContent className="p-6 space-y-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold">Authentication</h3>
            <p className="text-xs text-white/70">Include your API key in every request as the 'key' parameter.</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 space-y-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Terminal className="w-5 h-5 text-slate-600" />
            </div>
            <h3 className="font-bold text-slate-900">Response Format</h3>
            <p className="text-xs text-slate-500">All responses are returned in standard JSON format.</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Endpoints</h2>
        {endpoints.map((ep, i) => (
          <Card key={i} className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-slate-50 border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary hover:bg-primary">{ep.method}</Badge>
                <CardTitle className="text-lg">{ep.name}</CardTitle>
              </div>
              <code className="text-xs font-bold text-slate-400">action: {ep.action}</code>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Parameters</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-lg">key (required)</Badge>
                    <Badge variant="outline" className="rounded-lg">action (required)</Badge>
                    {ep.params.map((p, pi) => (
                      <Badge key={pi} variant="outline" className="rounded-lg">{p}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Example Request</h4>
                  <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs">
                    POST https://smmpro.com/api/v2 <br />
                    Content-Type: application/x-www-form-urlencoded <br /><br />
                    key=YOUR_API_KEY&action={ep.action}{ep.params.length > 0 ? '&' + ep.params[0].split(' ')[0] + '=...' : ''}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ApiDocs;
