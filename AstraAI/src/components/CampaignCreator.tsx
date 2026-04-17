import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  PenTool,
  RefreshCw,
  Clock,
  Zap,
  Shield,
  MessageSquare,
  Instagram,
  Youtube,
  ImageIcon,
  Play
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from 'framer-motion';

interface CampaignCreatorProps {
  onCreate: (data: any) => void;
  isLooping: boolean;
}

export function CampaignCreator({ onCreate, isLooping }: CampaignCreatorProps) {
  const [idea, setIdea] = React.useState('');
  const [targetAudience, setTargetAudience] = React.useState('');
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [type, setType] = React.useState('poster'); // poster, text, video
  const [aesthetic, setAesthetic] = React.useState('');
  const [rules, setRules] = React.useState('');
  const [autoApproval, setAutoApproval] = React.useState(false);

  const handleSubmit = () => {
    onCreate({
      idea,
      targetAudience,
      aspectRatio,
      type: type === 'poster' ? 'image' : type,
      aesthetic,
      rules,
      autoApproval
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-12 px-4">
      <Card className="bg-[#1A1E26] border-[#2D3748] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border-t-0 ring-1 ring-white/5">
        <div className="p-8 md:p-12 space-y-10">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-[#3B82F6] rounded-2xl shadow-[0_8px_25px_rgba(59,130,246,0.4)]">
                <PenTool className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">Agent 6: Strategic Content Refiner</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] md:text-[11px] uppercase font-black tracking-[0.3em] text-[#3B82F6]/80">Interactive Creative Pipeline</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-black/30 px-6 py-4 rounded-3xl border border-white/5 self-end md:self-auto">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8]">Auto-Approve Batch</span>
               <Switch 
                checked={autoApproval} 
                onCheckedChange={setAutoApproval}
                className="data-[state=checked]:bg-[#3B82F6]" 
               />
            </div>
          </div>

          {/* Main Action Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Input Fields */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-3">
                <Label className="text-[11px] uppercase font-black tracking-[0.2em] text-[#94A3B8] ml-1">Campaign Idea</Label>
                <Textarea 
                  placeholder="What's the mission?"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="bg-black/40 border-[#2D3748] rounded-3xl min-h-[180px] text-xl font-bold italic text-white placeholder:text-[#94A3B8]/20 focus:border-[#3B82F6]/50 focus:ring-0 transition-all resize-none px-6 py-5"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[11px] uppercase font-black tracking-[0.2em] text-[#94A3B8] ml-1">Target Audience</Label>
                  <Input 
                    placeholder="Who are we reaching?"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="bg-black/40 h-16 border-[#2D3748] rounded-2xl text-white font-bold px-6 focus:border-[#3B82F6]/50 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] uppercase font-black tracking-[0.2em] text-[#94A3B8] ml-1">Visual Aesthetic</Label>
                  <Input 
                    placeholder="Minimalist, Vibrant, etc."
                    value={aesthetic}
                    onChange={(e) => setAesthetic(e.target.value)}
                    className="bg-black/40 h-16 border-[#2D3748] rounded-2xl text-white font-bold px-6 focus:border-[#3B82F6]/50 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Controls */}
            <div className="lg:col-span-5 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[11px] uppercase font-black tracking-[0.2em] text-[#94A3B8] ml-1">Format Type</Label>
                  <div className="flex gap-2">
                    {['POSTER', 'TEXT', 'VIDEO'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setType(f.toLowerCase())}
                        className={`flex-1 h-14 rounded-2xl font-black text-[10px] tracking-widest transition-all ${
                          type === f.toLowerCase()
                            ? 'bg-[#3B82F6] text-white shadow-[0_4px_20px_rgba(59,130,246,0.3)]'
                            : 'bg-black/40 text-[#94A3B8] border border-[#2D3748] hover:bg-black/60'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[11px] uppercase font-black tracking-[0.2em] text-[#94A3B8] ml-1">Aspect Ratio</Label>
                  <div className="flex gap-2">
                    {['1:1', '16:9', '9:16'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setAspectRatio(r)}
                        className={`flex-1 h-14 rounded-2xl font-black text-[10px] tracking-widest transition-all ${
                          aspectRatio === r
                            ? 'bg-[#3B82F6] text-white shadow-[0_4px_20px_rgba(59,130,246,0.3)]'
                            : 'bg-black/40 text-[#94A3B8] border border-[#2D3748] hover:bg-black/60'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[11px] uppercase font-black tracking-[0.2em] text-[#94A3B8] ml-1">Strict Compliance Rules</Label>
                <Input 
                  placeholder="Nothing"
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  className="bg-black/40 h-16 border-[#2D3748] rounded-2xl text-white font-bold px-6 focus:border-[#3B82F6]/50 transition-all"
                />
              </div>

              <Button 
                disabled={isLooping || !idea}
                onClick={handleSubmit}
                className="w-full h-20 rounded-3xl bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-black uppercase tracking-[0.3em] text-sm gap-4 shadow-[0_15px_40px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:grayscale disabled:opacity-50"
              >
                <RefreshCw className={`w-7 h-7 ${isLooping ? 'animate-spin' : ''}`} />
                Neural Loop Processing...
              </Button>
            </div>
          </div>

          {/* Bottom Module Section - Only shown during active processing */}
          <AnimatePresence>
            {isLooping && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="pt-10 border-t border-white/5 space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#3B82F6]">Agent Rating System Active</h3>
                    <p className="text-xs text-[#94A3B8] italic">Feedback Cycle: Recursive Optimization</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { 
                      id: 1, 
                      label: 'Module 1', 
                      status: 'Finalizing High-Resolution Media (Poster)...',
                      active: true 
                    },
                    { 
                      id: 2, 
                      label: 'Module 2', 
                      status: 'Attempt 1: Generating optimized content bundle...', 
                      active: true 
                    },
                    { 
                      id: 3, 
                      label: 'Module 3', 
                      status: 'Processing Critique...', 
                      active: true 
                    },
                    { 
                      id: 4, 
                      label: 'Module 4', 
                      status: 'Finalizing Deployment...', 
                      active: true 
                    }
                  ].map((module) => (
                    <div key={module.id} className="bg-black/40 border border-[#2D3748] p-6 rounded-3xl space-y-4 relative group hover:border-[#3B82F6]/30 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">{module.label}</span>
                        <RefreshCw className={`w-4 h-4 text-[#3B82F6] animate-spin`} />
                      </div>
                      <p className="text-[11px] font-bold text-white/90 leading-[1.6] italic min-h-[3rem]">
                        {module.status}
                      </p>
                      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '70%' }}
                          transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                          className="h-full bg-[#3B82F6]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
      <p className="text-center text-[10px] md:text-[11px] text-[#94A3B8]/40 font-black uppercase tracking-widest">Autonomous Pipeline: Version 6.42.0 // Secured Connection</p>
    </div>
  );
}
