import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, RefreshCw, Unlink, X, Instagram, Youtube, Send, MessageSquare, Facebook, ExternalLink, ShieldCheck } from 'lucide-react';
import { getSocialAuthUrl } from '../services/socialService';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { toast } from 'sonner';

const PLATFORMS = [
  { id: 'X', name: 'X (Twitter)', icon: X, color: '#000000' },
  { id: 'Instagram', name: 'Instagram', icon: Instagram, color: '#E1306C' },
  { id: 'YouTube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'Telegram', name: 'Telegram', icon: Send, color: '#0088cc' },
  { id: 'Discord', name: 'Discord', icon: MessageSquare, color: '#5865F2' },
  { id: 'Facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
];

export function SocialConnections() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'social_connections'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConnections(data);
    });

    return () => unsubscribe();
  }, []);

  const handleConnect = async (platform: string) => {
    setLoading(prev => ({ ...prev, [platform]: true }));
    try {
      const { url } = await getSocialAuthUrl(platform);
      
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;
      
      const authWindow = window.open(
        url,
        `auth_${platform}`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        toast.error('Popup blocked. Please allow popups to connect social accounts.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate connection');
    } finally {
      setLoading(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handleDisconnect = async (id: string, platform: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;
    
    try {
      await deleteDoc(doc(db, 'social_connections', id));
      toast.success(`${platform} disconnected successfully`);
    } catch (error) {
      toast.error('Failed to disconnect platform');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Globe className="w-8 h-8 text-[#3B82F6]" />
          Integrations Hub
        </h2>
        <p className="text-[#94A3B8] text-sm max-w-2xl">
          Connect your brand's social presence to enable direct multi-channel deployment and real-time performance telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLATFORMS.map((platform) => {
          const connection = connections.find(c => c.platform === platform.id);
          const Icon = platform.icon;
          const isLoading = loading[platform.id];

          return (
            <Card key={platform.id} className="bg-[#1A1E26] border-[#2D3748] rounded-[2rem] overflow-hidden group hover:border-[#3B82F6]/50 transition-all p-8 flex flex-col justify-between min-h-[220px]">
              <div className="flex justify-between items-start">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: `${platform.color}15`, border: `1px solid ${platform.color}30` }}
                >
                  <Icon className="w-8 h-8" style={{ color: platform.color }} />
                </div>
                {connection ? (
                  <Badge className="bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-black">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-[#2D3748] text-[#94A3B8] px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-black">
                    Disconnected
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">{platform.name}</h3>
                {connection && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] font-mono">
                    <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                    <span>@{connection.username || 'Linked User'}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5">
                {connection ? (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between h-10 px-4 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all text-[#94A3B8] group/btn"
                    onClick={() => handleDisconnect(connection.id, platform.id)}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">Manage Connection</span>
                    <Unlink className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                  </Button>
                ) : (
                  <Button 
                    variant="secondary"
                    className="w-full justify-between h-10 px-4 bg-white/5 hover:bg-[#3B82F6]/10 hover:text-[#3B82F6] rounded-xl transition-all border border-transparent hover:border-[#3B82F6]/30 text-white"
                    disabled={isLoading}
                    onClick={() => handleConnect(platform.id)}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {isLoading ? 'Connecting...' : 'Link Account'}
                    </span>
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="bg-[#1A1E26] border-[#3B82F6]/20 rounded-[2rem] p-8 border-dashed">
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white tracking-tight">Need a custom enterprise integration?</h4>
            <p className="text-sm text-[#94A3B8]">Deploy private agents to Slack, Discord Bots, or localized intranet systems.</p>
          </div>
          <Button variant="outline" className="border-[#2D3748] text-[#94A3B8] rounded-[2rem] px-8 hover:bg-[#3B82F6]/10 hover:text-[#3B82F6] hover:border-[#3B82F6]/30 transition-all font-bold text-xs uppercase tracking-widest h-12">
            Contact Engineering
          </Button>
        </div>
      </Card>
    </div>
  );
}
