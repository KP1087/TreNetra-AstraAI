import React from 'react';
import { 
  LayoutDashboard, 
  PenTool, 
  BarChart3, 
  Calendar, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  Menu,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Zap,
  Monitor,
  Search,
  Target,
  Shield,
  Briefcase,
  Layers,
  Flame,
  Youtube,
  Facebook,
  Instagram,
  RefreshCw,
  Globe,
  Plus,
  Trash2,
  X,
  Clock,
  Eye,
  Send,
  Share2,
  ExternalLink,
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { useOrchestrator } from './lib/orchestrator';
import { generateImage } from './lib/gemini';
import { CampaignCreator } from './components/CampaignCreator';
import { SocialConnections } from './components/SocialConnections';
import { deployPostToSocial } from './services/socialService';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function App() {
  const { 
    user, brand, posts, campaigns, connections, analytics, state, 
    runFullLoop, setPosts, isReady, login, 
    addUploadedImage, updateLogo, removeImage, savePhotoshootResult, createCampaign
  } = useOrchestrator();
  const [activeTab, setActiveTab] = React.useState('overview');
  const [userInput, setUserInput] = React.useState('');
  const [targetPlatforms, setTargetPlatforms] = React.useState(['X', 'YouTube', 'Facebook', 'Instagram', 'Pinterest', 'Discord']);
  const [newPlatform, setNewPlatform] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const [isPhotoshooting, setIsPhotoshooting] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  
  // Scheduling States
  const [schedulingPost, setSchedulingPost] = React.useState<any>(null);
  const [scheduledDate, setScheduledDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [scheduledTime, setScheduledTime] = React.useState('12:00');

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium animate-pulse">Initializing Neural Interface...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] p-6 text-center">
        <Card className="max-w-md w-full shadow-2xl border-none rounded-[2rem] p-12 space-y-8 bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="space-y-4 relative z-10">
            <div className="bg-[#141414] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
              <Zap className="text-primary w-8 h-8 fill-primary" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">OMNIMARKET AI</h1>
            <p className="text-[#141414]/60 text-lg leading-relaxed">
              Connect your account to deploy your multi-agent marketing squadron.
            </p>
          </div>

          <Button 
            onClick={login}
            size="lg" 
            className="w-full h-14 rounded-2xl bg-[#141414] hover:bg-[#141414]/90 text-white font-bold text-lg shadow-lg relative z-10"
          >
            <Globe className="mr-3 w-5 h-5" />
            Login with Google
          </Button>

          <p className="text-[10px] text-[#141414]/30 uppercase tracking-[0.2em] font-bold">
            Secure Enterprise Encryption Active
          </p>
        </Card>
      </div>
    );
  }

  const handleRunSystem = async () => {
    if (!userInput) {
      toast.error('Please enter brand details or a website URL');
      return;
    }
    toast.info('Agent 1: Initializing Brand Intelligence & Market Research...');
    await runFullLoop(userInput, targetPlatforms);
    toast.success('System Loop Completed Successfully');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadstart = () => setIsUploadingImage(true);
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      toast.info('Uploading image to brand assets...');
      try {
        await addUploadedImage(base64String);
        toast.success('Image added to brand identity');
      } catch (err) {
        toast.error('Failed to upload image');
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      toast.info('Updating brand logo...');
      await updateLogo(base64String);
      toast.success('Brand logo updated successfully');
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const handleTryPhotoshoot = async () => {
    if (!brand) return;
    setIsPhotoshooting(true);
    toast.info('Agent 5: Conceptualizing Premium Human-Centric Poster...');
    
    try {
      const productsStr = brand.products?.join(", ") || "products";
      const photoshootPrompt = `A high-end, professional commercial marketing poster for the brand "${brand.name}". 
      The image features a stylish human model (diverse and modern) naturally and authentically interacting with ${productsStr}. 
      Set in a beautifully lit ${brand.aesthetic} environment that perfectly matches the brand's identity. 
      Professional studio lighting, sharp focus, 8k resolution, cinematic composition. 
      Color palette: ${brand.colors.join(", ")}. 
      The look should be editorial, like a high-fashion or tech lifestyle advertisement.`;
      
      const generatedImage = await generateImage(photoshootPrompt, "16:9");
      
      if (generatedImage) {
        await savePhotoshootResult(generatedImage);
        toast.success('Photoshoot completed. Result saved to assets and drafts.');
      } else {
        toast.error('Failed to generate photoshoot image');
      }
    } catch (error) {
      console.error("Photoshoot Error:", error);
      toast.error('Photoshoot sequence failed');
    } finally {
      setIsPhotoshooting(false);
    }
  };

  const addPlatform = () => {
    if (newPlatform && !targetPlatforms.map(p => p.toLowerCase()).includes(newPlatform.toLowerCase())) {
      setTargetPlatforms([...targetPlatforms, newPlatform]);
      setNewPlatform('');
      toast.success(`Platform "${newPlatform}" added to research target`);
    }
  };

  const approvePost = async (id: string) => {
    try {
      const postRef = doc(db, 'posts', id);
      await setDoc(postRef, { status: 'approved' }, { merge: true });
      toast.success('Post approved for scheduling');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'posts');
    }
  };

  const schedulePost = async (id: string, time: string) => {
    try {
      const post = posts.find(p => p.id === id);
      if (!post) return;
      
      const postRef = doc(db, 'posts', id);
      await setDoc(postRef, { 
        status: 'scheduled', 
        scheduledAt: time 
      }, { merge: true });
      toast.success('Campaign successfully queued for deployment');
    } catch (error) {
      console.error("Scheduling failed:", error);
      toast.error('Failed to update campaign schedule');
    }
  };

  const handleDeployPost = async (id: string, platform: string) => {
    const isConnected = connections.some(c => c.platform === platform);
    if (!isConnected) {
      toast.error(`Please connect your ${platform} account first in the Connections tab.`);
      setActiveTab('connections');
      return;
    }

    toast.info(`Deploying post to ${platform}...`);
    try {
      await deployPostToSocial(id);
      toast.success(`Successfully posted to ${platform}!`);
    } catch (error: any) {
      toast.error(error.message || 'Deployment failed');
    }
  };

  const pieData = [
    { name: 'Success', value: posts.filter(p => (p.score || 0) >= 8).length },
    { name: 'Needs Work', value: posts.filter(p => (p.score || 0) < 8).length },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] font-sans text-[#F8FAFC] flex">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside className="w-60 border-r border-[#2D3748] bg-[#151921] flex flex-col hidden md:flex">
        <div className="p-6 border-b border-[#2D3748] flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#3B82F6] fill-[#3B82F6]/20" />
          <span className="font-extrabold text-base tracking-tight uppercase">Core-Agent</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 transition-all relative ${
                activeTab === item.id 
                  ? 'text-[#F8FAFC] bg-[#3B82F6]/10 border-r-4 border-[#3B82F6]' 
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === item.id ? 'bg-[#3B82F6]' : 'bg-transparent border border-[#94A3B8]'}`} />
              <span className="text-xs uppercase tracking-wider font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0B0E14]">
        {/* Header */}
        <header className="h-16 border-b border-[#2D3748] bg-[#0B0E14]/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-medium uppercase tracking-widest text-[#94A3B8]">
              {activeTab}
            </h1>
            <ChevronRight className="w-3 h-3 text-[#2D3748]" />
            {state.isLooping && (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                <span className="text-xs font-mono text-primary uppercase">
                  Agent {state.currentAgent} active...
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-full shadow-none border-[#141414]/10">
              Documentation
            </Button>
            <Button size="sm" className="rounded-full bg-[#141414] hover:bg-[#141414]/90">
              Settings
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Hero Trigger */}
                <section className="bg-[#1E232D] border border-[#2D3748] rounded-2xl p-8 text-[#F8FAFC] relative overflow-hidden">
                  <div className="relative z-10 space-y-4 max-w-lg">
                    <Badge className="bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20 px-3 py-1 uppercase text-[10px] tracking-widest font-bold">Agents Active</Badge>
                    <h2 className="text-3xl font-bold tracking-tight">Marketing Orchestrator</h2>
                    <p className="text-[#94A3B8] text-sm leading-relaxed">
                      Initialize the 5-agent loop to automate brand intelligence, content factory, and feedback optimization.
                    </p>
                    <div className="flex gap-4 pt-4">
                      <Input 
                        placeholder="Website URL or product mission..." 
                        className="bg-[#0B0E14] border-[#2D3748] text-white placeholder:text-[#94A3B8]/50 h-10 text-sm"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                      />
                      <Button 
                        size="lg" 
                        onClick={handleRunSystem}
                        disabled={state.isLooping}
                        className="bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 h-10 px-6 font-bold text-xs uppercase tracking-widest"
                      >
                        {state.isLooping ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : <Play className="mr-2 h-3 w-3" />}
                        Run Cycle
                      </Button>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
                    <Zap className="w-full h-full transform translate-x-1/4 -translate-y-1/4" />
                  </div>
                </section>

                {/* Brand DNA Section */}
                <div className="space-y-6">
                  <div className="text-center space-y-2 py-4">
                    <div className="flex justify-center mb-2">
                       <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-[#3B82F6]" />
                       </div>
                    </div>
                    <h2 className="text-4xl font-serif font-black italic tracking-tight text-[#F8FAFC]">Your Business DNA</h2>
                    <p className="text-[#94A3B8] text-xs max-w-xl mx-auto tracking-wide leading-relaxed">
                      Here is a snapshot of your business that we'll use to create social media campaigns. Feel free to edit this at any time.
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-12 gap-6">
                    {/* Left Side: Brand Identity */}
                    <div className="lg:col-span-7 space-y-4">
                      {/* Identity Header */}
                      <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-8">
                         <div className="space-y-4">
                            <h3 className="text-4xl font-bold tracking-tight text-[#F8FAFC]">{brand?.name || 'Your Brand'}</h3>
                            <div className="flex items-center gap-2 text-[#3B82F6] text-sm">
                               <Globe className="w-4 h-4" />
                               <span className="font-mono">{brand?.website || 'https://yourbrand.com'}</span>
                            </div>
                         </div>
                      </Card>

                      {/* Assets Grid */}
                      <div className="grid grid-cols-2 gap-4">
                         <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-6 flex items-center justify-center aspect-square md:aspect-auto group relative cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                            <input 
                              type="file" 
                              className="hidden" 
                              ref={logoInputRef} 
                              accept="image/*"
                              onChange={handleLogoUpload}
                            />
                            <div className="w-32 h-32 bg-[#0B0E14] rounded-2xl flex items-center justify-center border border-[#2D3748] overflow-hidden group-hover:border-[#3B82F6] transition-colors">
                               {brand?.logo_url ? (
                                 <img 
                                   src={brand.logo_url} 
                                   alt="Brand Logo" 
                                   className="w-full h-full object-contain p-4" 
                                   referrerPolicy="no-referrer"
                                 />
                               ) : (
                                 <div className="flex flex-col items-center gap-2">
                                   <div className="text-4xl font-black text-[#3B82F6] drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                     {brand?.name?.[0] || 'B'}
                                   </div>
                                   <span className="text-[8px] uppercase font-bold text-[#94A3B8]">Upload Logo</span>
                                 </div>
                               )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-3xl">
                              <span className="text-xs font-bold uppercase tracking-widest">Update Logo</span>
                            </div>
                          </Card>
                         <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-8 flex flex-col justify-center gap-1">
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#94A3B8] mb-4">Fonts</p>
                            <div className="text-center">
                               <p className="text-5xl font-serif text-[#F59E0B]">Aa</p>
                               <p className="text-xs font-bold text-[#94A3B8] mt-2">{brand?.fonts?.[0] || 'Inter'}</p>
                            </div>
                         </Card>
                      </div>

                      {/* Colors */}
                      <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-8">
                         <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#94A3B8] mb-6">Colors</p>
                         <div className="flex flex-wrap gap-6">
                            {(brand?.colors || ['#0B0E14', '#3B82F6', '#94A3B8', '#F59E0B']).map((color, i) => (
                               <div key={i} className="space-y-3">
                                  <div 
                                    className="w-14 h-14 rounded-full border border-white/10 shadow-lg" 
                                    style={{ backgroundColor: color }}
                                  />
                                  <p className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase text-center">{color}</p>
                               </div>
                            ))}
                         </div>
                      </Card>

                      {/* Grid Sections */}
                      <div className="grid grid-cols-2 gap-4">
                         <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-8">
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#94A3B8] mb-4">Tagline</p>
                            <p className="text-2xl font-serif italic font-bold text-[#F59E0B] leading-tight">
                              {brand?.tagline || 'Your compelling message here'}
                            </p>
                         </Card>
                         <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-8">
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#94A3B8] mb-4">Brand values</p>
                            <div className="flex flex-wrap gap-2">
                               {(brand?.values || ['Innovation', 'Quality']).map((v, i) => (
                                  <Badge key={i} variant="outline" className="rounded-md border-[#2D3748] text-[#94A3B8] text-[10px] px-3 py-1 font-bold">{v}</Badge>
                               ))}
                            </div>
                         </Card>
                         <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-8">
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#94A3B8] mb-4">Brand aesthetic</p>
                            <div className="flex flex-wrap gap-2">
                               {brand?.aesthetic?.split(',').map((a, i) => (
                                  <Badge key={i} variant="outline" className="rounded-md border-[#2D3748] text-[#94A3B8] text-[10px] px-3 py-1 font-bold">{a.trim()}</Badge>
                               )) || <Badge variant="outline" className="rounded-md border-[#2D3748] text-[#94A3B8] text-[10px] px-3 py-1 font-bold">Modern</Badge>}
                            </div>
                         </Card>
                         <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-8">
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#94A3B8] mb-4">Brand tone of voice</p>
                            <div className="flex flex-wrap gap-2">
                               {brand?.tone?.split(',').map((t, i) => (
                                  <Badge key={i} variant="outline" className="rounded-md border-[#2D3748] text-[#94A3B8] text-[10px] px-3 py-1 font-bold">{t.trim()}</Badge>
                               )) || <Badge variant="outline" className="rounded-md border-[#2D3748] text-[#94A3B8] text-[10px] px-3 py-1 font-bold">Professional</Badge>}
                            </div>
                         </Card>
                      </div>

                      {/* Business Overview */}
                      <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-8">
                         <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#94A3B8] mb-4">Business overview</p>
                         <p className="text-xs text-[#94A3B8] leading-relaxed font-medium">
                           {brand?.description || 'We are a company focused on excellence and transformation...'}
                         </p>
                      </Card>
                    </div>

                    {/* Right Side: Images & Creatives */}
                    <div className="lg:col-span-5 space-y-4">
                       <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl overflow-hidden">
                          <div className="p-8 space-y-6">
                             <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#94A3B8]">Images</p>
                             <div className="grid grid-cols-3 gap-2">
                                {brand?.brand_images && brand.brand_images.length > 0 ? (
                                  brand.brand_images.map((img, i) => (
                                    <div key={i} className="aspect-square bg-black/40 rounded-lg overflow-hidden border border-[#2D3748] group relative">
                                      <img 
                                        src={img} 
                                        alt={`Brand asset ${i}`} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                                        referrerPolicy="no-referrer"
                                        onClick={() => setPreviewImage(img)}
                                      />
                                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                          size="icon" 
                                          variant="destructive" 
                                          className="w-6 h-6 rounded-md"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeImage(img);
                                          }}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  !isUploadingImage && [...Array(6)].map((_, i) => (
                                     <div key={i} className="aspect-square bg-black/40 rounded-lg overflow-hidden border border-[#2D3748] animate-pulse" />
                                  ))
                                )}
                                {isUploadingImage && (
                                  <div className="aspect-square bg-black/20 rounded-lg overflow-hidden border border-[#3B82F6] flex items-center justify-center animate-pulse">
                                    <RefreshCw className="w-4 h-4 text-[#3B82F6] animate-spin" />
                                  </div>
                                )}
                             </div>
                             <div className="p-6 bg-black/20 rounded-2xl border border-[#2D3748] space-y-4">
                                <h4 className="text-sm font-bold text-[#F8FAFC]">Endless creatives, ready in minutes</h4>
                                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                                  Skip the cost and complexity of traditional photoshoots and generate compelling, on-brand images that drive your sales.
                                </p>
                                <Button 
                                  onClick={handleTryPhotoshoot}
                                  disabled={isPhotoshooting || !brand}
                                  className="bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 border border-[#10B981]/30 rounded-full text-[10px] font-black uppercase px-6 h-10"
                                >
                                   {isPhotoshooting ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : <Play className="mr-2 h-3 w-3" />}
                                   Try Photoshoot
                                </Button>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="aspect-square bg-[#0B0E14] rounded-2xl border-2 border-dashed border-[#2D3748] flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-[#3B82F6]/50 transition-colors"
                                >
                                   <input 
                                     type="file" 
                                     className="hidden" 
                                     ref={fileInputRef} 
                                     accept="image/*"
                                     onChange={handleImageUpload}
                                   />
                                   <div className="p-2 bg-[#3B82F6]/10 rounded-lg group-hover:bg-[#3B82F6]/20 transition-colors">
                                      <RefreshCw className="w-4 h-4 text-[#3B82F6]" />
                                   </div>
                                   <span className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">Upload Images</span>
                                </div>
                                <div className="aspect-square bg-[#0B0E14] rounded-2xl border border-[#2D3748] flex items-center justify-center">
                                   <div className="w-16 h-16 bg-[#3B82F6]/20 rounded-xl flex items-center justify-center">
                                      <Zap className="w-8 h-8 text-[#3B82F6]" />
                                   </div>
                                </div>
                             </div>
                          </div>
                       </Card>

                       <div className="flex justify-end pt-4">
                          <Button 
                            variant="outline" 
                            className="bg-[#C1D2A4]/10 text-[#C1D2A4] hover:bg-[#C1D2A4]/20 border-[#C1D2A4]/30 rounded-full text-[10px] font-black uppercase tracking-widest px-8 h-12"
                          >
                             Reset Business DNA
                          </Button>
                       </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#2D3748] opacity-50 my-12" />

                {/* System Logs Terminal */}
                <Card className="shadow-none border-[#2D3748] bg-black rounded-xl overflow-hidden mt-8">
                  <div className="bg-[#1E232D] px-4 py-2 border-b border-[#2D3748] flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest uppercase text-[#94A3B8]">Mainframe Logs</span>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#EF4444]/40" />
                      <div className="w-2 h-2 rounded-full bg-[#F59E0B]/40" />
                      <div className="w-2 h-2 rounded-full bg-[#10B981]/40" />
                    </div>
                  </div>
                  <div className="p-4 font-mono text-[11px] h-48 overflow-y-auto space-y-1 text-[#10B981]">
                    <p><span className="text-white/20 mr-2">[{new Date().toLocaleTimeString()}]</span> <span className="text-[#3B82F6]">ORCHESTRATOR:</span> System standby. Awaiting mission parameters...</p>
                    {brand && <p><span className="text-white/20 mr-2">[{new Date().toLocaleTimeString()}]</span> <span className="text-[#10B981]">AGENT_BRAND:</span> Profile synthesized for <span className="text-white">{brand.name}</span>. Precision: 0.98.</p>}
                    {posts.length > 0 && <p><span className="text-white/20 mr-2">[{new Date().toLocaleTimeString()}]</span> <span className="text-[#10B981]">AGENT_CONTENT:</span> {posts.length} drafts validated. Memory vectors synchronized.</p>}
                    {analytics && <p><span className="text-white/20 mr-2">[{new Date().toLocaleTimeString()}]</span> <span className="text-[#F59E0B]">AGENT_ANALYTICS:</span> Performance trend identified. Optimization logic patched.</p>}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'connections' && <SocialConnections />}

            {activeTab === 'research' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-serif font-black italic tracking-tight text-[#F8FAFC]">Market Intelligence</h2>
                    <p className="text-[#94A3B8] text-sm italic">Competitive landscape and cross-platform trend analysis.</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20">Deep Research Active</Badge>
                    <div className="flex gap-2">
                       <Input 
                         value={newPlatform}
                         onChange={(e) => setNewPlatform(e.target.value)}
                         placeholder="Add platform (e.g. TikTok)..." 
                         className="h-9 text-[11px] w-48 bg-black/20 border-[#2D3748] placeholder:text-white/20"
                         onKeyDown={(e) => e.key === 'Enter' && addPlatform()}
                       />
                       <Button size="sm" onClick={addPlatform} className="h-9 w-9 bg-[#3B82F6] p-0 flex items-center justify-center">
                         <Plus className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 p-4 bg-black/20 border border-[#2D3748] rounded-2xl">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#94A3B8] w-full mb-1">Target Platforms</span>
                  {targetPlatforms.map(p => (
                    <Badge key={p} variant="secondary" className="bg-[#1E232D] text-[#F8FAFC] border-[#2D3748] flex items-center gap-2 px-3 py-1 group">
                      {p}
                      <button onClick={() => setTargetPlatforms(targetPlatforms.filter(tp => tp !== p))} className="hover:text-red-400 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {targetPlatforms.length === 0 && <span className="text-[10px] italic text-[#94A3B8]/40">No platforms selected. Add one to start research.</span>}
                </div>

                {brand ? (
                  <>
                    {/* Market & Products */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-[#F59E0B]/10 rounded-lg">
                            <Briefcase className="w-5 h-5 text-[#F59E0B]" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#94A3B8]">Field of Competition</p>
                            <h3 className="text-xl font-bold text-[#F8FAFC]">{brand.competition_area}</h3>
                          </div>
                        </div>
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#94A3B8] mb-4">Core Products/Services</p>
                        <div className="flex flex-wrap gap-2">
                          {brand.products?.map((p, i) => (
                            <Badge key={i} className="bg-[#3B82F6]/10 text-[#3B82F6] border-none px-4 py-1.5 rounded-full font-bold text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </Card>

                      <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-[#EF4444]/10 rounded-lg">
                            <Target className="w-5 h-5 text-[#EF4444]" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#94A3B8]">Strong Competitors</p>
                            <h3 className="text-xl font-bold text-[#F8FAFC]">Market Rivals</h3>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {brand.strong_competitors?.map((c, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-[#2D3748]/50">
                              <div className="w-8 h-8 rounded-full bg-[#1E232D] flex items-center justify-center font-black text-[#94A3B8] text-[10px]">
                                {i + 1}
                              </div>
                              <span className="text-sm font-bold text-[#F8FAFC]">{c}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>

                    {/* SWOT Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-6 border-t-4 border-t-[#10B981]">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#10B981] mb-4">Strengths</p>
                        <ul className="space-y-2">
                          {brand.competitor_insights.strengths.map((s, i) => (
                            <li key={i} className="text-[11px] text-[#94A3B8] flex gap-2">
                              <CheckCircle2 className="w-3 h-3 text-[#10B981] shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </Card>
                      <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-6 border-t-4 border-t-[#EF4444]">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#EF4444] mb-4">Weaknesses</p>
                        <ul className="space-y-2">
                          {brand.competitor_insights.weaknesses.map((w, i) => (
                            <li key={i} className="text-[11px] text-[#94A3B8] flex gap-2">
                              <AlertCircle className="w-3 h-3 text-[#EF4444] shrink-0 mt-0.5" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </Card>
                      <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-6 border-t-4 border-t-[#F59E0B]">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#F59E0B] mb-4">Market Gaps</p>
                        <ul className="space-y-2">
                          {brand.competitor_insights.market_gaps.map((g, i) => (
                            <li key={i} className="text-[11px] text-[#94A3B8] flex gap-2">
                              <Search className="w-3 h-3 text-[#F59E0B] shrink-0 mt-0.5" />
                              {g}
                            </li>
                          ))}
                        </ul>
                      </Card>
                      <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl p-6 border-t-4 border-t-[#3B82F6]">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#3B82F6] mb-4">Opportunities</p>
                        <ul className="space-y-2">
                          {brand.competitor_insights.opportunities.map((o, i) => (
                            <li key={i} className="text-[11px] text-[#94A3B8] flex gap-2">
                              <TrendingUp className="w-3 h-3 text-[#3B82F6] shrink-0 mt-0.5" />
                              {o}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </div>

                    {/* Social Trends */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <h3 className="text-xl font-bold text-[#F8FAFC]">Cross-Platform Trends</h3>
                      </div>
                      <div className="grid md:grid-cols-3 gap-6">
                        {brand.social_trends?.map((t, i) => (
                          <Card key={i} className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-3xl overflow-hidden">
                            <div className="bg-black/20 p-4 border-b border-[#2D3748] flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {t.platform.toLowerCase() === 'x' && <span className="font-bold">𝕏</span>}
                                {t.platform.toLowerCase() === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                                {t.platform.toLowerCase() === 'facebook' && <Facebook className="w-4 h-4 text-blue-600" />}
                                {t.platform.toLowerCase() === 'instagram' && <Instagram className="w-4 h-4 text-pink-500" />}
                                {t.platform.toLowerCase() === 'pinterest' && <Globe className="w-4 h-4 text-red-600" />}
                                {t.platform.toLowerCase() === 'discord' && <MessageSquare className="w-4 h-4 text-indigo-500" />}
                                {t.platform.toLowerCase() === 'tiktok' && <Zap className="w-4 h-4 text-cyan-400" />}
                                {!['x', 'youtube', 'facebook', 'instagram', 'pinterest', 'discord', 'tiktok'].includes(t.platform.toLowerCase()) && <Globe className="w-4 h-4 text-[#94A3B8]" />}
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#F8FAFC]">{t.platform}</span>
                              </div>
                              <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] text-[8px] uppercase">Trending</Badge>
                            </div>
                            <div className="p-6 space-y-4">
                              {t.trends.map((trend, idx) => (
                                <div key={idx} className="flex gap-3 items-start">
                                  <div className="text-[#3B82F6] font-mono text-[10px] mt-0.5">#{idx + 1}</div>
                                  <p className="text-xs text-[#94A3B8] leading-relaxed font-medium">{trend}</p>
                                </div>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-24 text-center border-2 border-dashed border-[#2D3748] rounded-3xl bg-black/5">
                    <Search className="mx-auto h-12 w-12 text-[#94A3B8]/10 mb-4" />
                    <h3 className="font-bold text-lg text-[#F8FAFC]">Intelligence Gap Identified</h3>
                    <p className="text-xs text-[#94A3B8] max-w-xs mx-auto mt-2 font-medium">
                      Execute the brand cycle to synthesize market research and platform trends.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500 pb-20">
                <CampaignCreator 
                  onCreate={createCampaign} 
                  isLooping={state.isLooping && state.currentAgent === 6} 
                />

                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-serif text-[#141414]">Factory Output</h2>
                    <p className="text-[#141414]/50 text-sm">AI-validated content drafts pending synchronization.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.filter(p => p.status === 'draft' || p.status === 'pending' || p.status === 'approved').length > 0 ? (
                    posts.filter(p => p.status === 'draft' || p.status === 'pending' || p.status === 'approved').map((post) => (
                      <Card key={post.id} className={`shadow-none bg-[#1E232D] border-[#2D3748] border-t-4 overflow-hidden flex flex-col ${post.status === 'approved' ? 'border-t-[#10B981]' : 'border-t-[#3B82F6]'}`}>
                        <div className="relative aspect-square md:aspect-video lg:aspect-square bg-black/20 flex flex-col items-center justify-center border-b border-[#2D3748] overflow-hidden group">
                          {post.mediaType === 'image' && post.imageUrl ? (
                            <img 
                              src={post.imageUrl} 
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 cursor-zoom-in" 
                              referrerPolicy="no-referrer" 
                              onClick={() => setPreviewImage(post.imageUrl)}
                            />
                          ) : post.mediaType === 'video' && post.videoUrl ? (
                            <video src={post.videoUrl} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop />
                          ) : (
                            <div className="flex flex-col items-center gap-3 opacity-20">
                              <ImageIcon className="w-12 h-12" />
                              <span className="text-[10px] font-black uppercase tracking-widest">No Media</span>
                            </div>
                          )}
                          
                          {/* Platform Overlay */}
                          <div className="absolute top-3 left-3 z-10">
                            <Badge className="bg-black/60 backdrop-blur-md text-[#F8FAFC] border-[#2D3748] text-[10px] uppercase font-bold px-3 py-1 flex items-center gap-2">
                              {post.platform === 'X' && <span className="font-bold">𝕏</span>}
                              {post.platform === 'Instagram' && <Instagram className="w-3 h-3 text-pink-500" />}
                              {post.platform === 'YouTube' && <Youtube className="w-3 h-3 text-red-500" />}
                              {post.platform === 'Discord' && <MessageSquare className="w-3 h-3 text-indigo-500" />}
                              {post.platform}
                            </Badge>
                          </div>

                          {/* Score Overlay */}
                          <div className="absolute top-3 right-3 z-10">
                            <Badge className="bg-[#10B981]/80 backdrop-blur-md text-white border-none text-[10px] font-black px-2 py-0.5 rounded-sm">
                              {post.score}/10
                            </Badge>
                          </div>

                          {post.mediaType === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors">
                              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                                <Play className="w-5 h-5 text-white fill-white ml-1" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#3B82F6]">{post.mediaType} Campaign</h4>
                              <StarRating score={post.score} />
                            </div>
                            <p className="text-[13px] leading-relaxed line-clamp-4 text-[#94A3B8] font-medium italic">
                              "{post.content}"
                            </p>
                          </div>

                          <div className="flex flex-col gap-3 pt-4 border-t border-[#2D3748]/50">
                            <div className="flex items-center justify-between gap-3">
                              <Dialog>
                                <DialogTrigger 
                                  render={
                                    post.status === 'draft' || post.status === 'pending' || post.status === 'failed' ? (
                                      <Button 
                                        className="flex-1 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-black text-[10px] uppercase tracking-widest h-11 rounded-xl shadow-lg shadow-[#3B82F6]/20"
                                      />
                                    ) : (
                                      <Button 
                                        variant="outline"
                                        className="border-[#2D3748] text-[#94A3B8] hover:bg-white/5 font-black text-[10px] uppercase tracking-widest h-9 px-3 rounded-xl"
                                      />
                                    )
                                  }
                                  onClick={() => {
                                    setSchedulingPost(post);
                                    setScheduledDate(format(new Date(), 'yyyy-MM-dd'));
                                  }}
                                >
                                  {post.status === 'draft' || post.status === 'pending' || post.status === 'failed' ? (
                                    'Finalize & Approve'
                                  ) : (
                                    <Calendar className="w-4 h-4" />
                                  )}
                                </DialogTrigger>
                                <DialogContent className="bg-[#1E232D] border-[#2D3748] text-white rounded-3xl p-8 max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="text-2xl font-serif font-black italic tracking-tight mb-2">Configure Deployment</DialogTitle>
                                    <p className="text-[#94A3B8] text-xs italic">Set precise activation coordinates for your generated asset.</p>
                                  </DialogHeader>
                                  <div className="space-y-6 pt-6">
                                    <div className="space-y-2">
                                      <Label className="text-[10px] uppercase font-black tracking-widest text-[#94A3B8]">Deployment Date</Label>
                                      <Input 
                                        type="date" 
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        className="bg-black/20 border-[#2D3748] rounded-xl h-12 text-sm text-white"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-[10px] uppercase font-black tracking-widest text-[#94A3B8]">Target Time</Label>
                                      <Input 
                                        type="time" 
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="bg-black/20 border-[#2D3748] rounded-xl h-12 text-sm text-white"
                                      />
                                    </div>
                                    <div className="space-y-3">
                                      <Label className="text-[10px] uppercase font-black tracking-widest text-[#94A3B8]">Smart Timing Suggestions</Label>
                                      <div className="grid grid-cols-2 gap-2">
                                        {[
                                          { label: 'Morning Peak', time: '09:00' },
                                          { label: 'Lunch Spike', time: '12:00' },
                                          { label: 'Afternoon Flow', time: '15:30' },
                                          { label: 'Evening Surge', time: '20:00' }
                                        ].map((suggestion) => (
                                          <Button
                                            key={suggestion.time}
                                            variant="outline"
                                            className={`text-[10px] font-bold uppercase rounded-xl h-10 border-[#2D3748] transition-all flex items-center justify-center ${
                                              scheduledTime === suggestion.time 
                                                ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6]' 
                                                : 'bg-black/10 text-[#94A3B8] hover:bg-black/20'
                                            }`}
                                            onClick={() => setScheduledTime(suggestion.time)}
                                          >
                                            <Clock className="w-3 h-3 mr-2" />
                                            {suggestion.label}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <DialogFooter className="pt-8 gap-2">
                                    <DialogClose 
                                      render={
                                        <Button 
                                          className="flex-1 bg-[#10B981] hover:bg-[#10B981]/90 text-white rounded-xl h-12 font-black uppercase tracking-widest"
                                        />
                                      }
                                      onClick={async () => {
                                        if (!schedulingPost) return;
                                        const fullDate = `${scheduledDate}T${scheduledTime}:00`;
                                        toast.promise(schedulePost(schedulingPost.id, fullDate), {
                                          loading: 'Transmitting schedule to mainframe...',
                                          success: 'Deployment sequence locked in!',
                                          error: 'Failed to synchronize schedule'
                                        });
                                        setActiveTab('scheduler');
                                      }}
                                    >
                                      Synchronize & Push
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              
                              {(post.status === 'approved' || post.status === 'scheduled') && (
                                <Button 
                                  className="bg-[#10B981] hover:bg-[#10B981]/90 text-white font-black text-[10px] uppercase tracking-widest h-9 px-6 rounded-xl shadow-lg shadow-[#10B981]/20 flex items-center gap-2"
                                  onClick={() => handleDeployPost(post.id, post.platform)}
                                >
                                  <Zap className="w-3 h-3 fill-white" />
                                  Deploy Now
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                      ))
                        ) : (
                          <div className="lg:col-span-3 py-20 text-center space-y-4 border-2 border-dashed border-[#2D3748] rounded-[2.5rem] bg-[#1E232D]/50">
                            <div className="w-20 h-20 bg-black/20 rounded-full flex items-center justify-center mx-auto">
                              <PenTool className="w-10 h-10 text-[#94A3B8]/20" />
                            </div>
                            <div>
                              <p className="text-[#F8FAFC] font-serif font-black italic text-xl uppercase tracking-tight">Factory Offline</p>
                              <p className="text-xs text-[#94A3B8] max-w-xs mx-auto mt-2 font-medium">
                                No content drafts available. Initialize the campaign creator to generate multi-channel assets.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

            {activeTab === 'analytics' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-3 gap-6">
                  <StatCard label="Total Reach" value={`${(analytics?.views || 0).toLocaleString()}`} trend="+24%" icon={Globe} />
                  <StatCard label="Avg. Engagement" value={`${analytics?.likes ? ((analytics.likes / (analytics.views || 1)) * 100).toFixed(1) : 0}%`} trend="+0.8%" icon={TrendingUp} />
                  <StatCard label="Sentiment Index" value={analytics?.sentiment === 'positive' ? '84/100' : '52/100'} trend="+5.2" icon={CheckCircle2} />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-2xl p-6">
                    <CardHeader className="px-0 pt-0 pb-6 border-b border-[#2D3748]/50">
                      <CardTitle className="text-xs uppercase tracking-widest text-[#94A3B8] font-black">Voice of Customer</CardTitle>
                      <CardDescription className="text-[10px] text-[#94A3B8]/60 uppercase tracking-tighter">Pain Points & Feature Requests</CardDescription>
                    </CardHeader>
                    <div className="pt-6 space-y-6">
                      <div>
                        <p className="text-[10px] font-black uppercase text-red-500 mb-2">Critical Pain Points</p>
                        <div className="space-y-2">
                          {analytics?.pain_points?.map((p, i) => (
                            <div key={i} className="flex gap-2 text-[11px] text-[#94A3B8] items-start">
                              <AlertCircle className="w-3 h-3 text-red-500 mt-0.5" />
                              <span>{p}</span>
                            </div>
                          )) || <p className="text-xs italic text-[#94A3B8]/40">Gathering telemetry...</p>}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#3B82F6] mb-2">Feature High-Demand</p>
                        <div className="space-y-2">
                          {analytics?.feature_requests?.map((f, i) => (
                            <div key={i} className="flex gap-2 text-[11px] text-[#94A3B8] items-start">
                              <Zap className="w-3 h-3 text-[#3B82F6] mt-0.5" />
                              <span>{f}</span>
                            </div>
                          )) || <p className="text-xs italic text-[#94A3B8]/40">Analyzing requests...</p>}
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-2xl p-6">
                    <CardHeader className="px-0 pt-0 pb-6 border-b border-[#2D3748]/50">
                      <CardTitle className="text-xs uppercase tracking-widest text-[#94A3B8] font-black">Optimization Suggestions</CardTitle>
                    </CardHeader>
                    <div className="pt-6 space-y-4">
                      {analytics?.suggestions.map((s, i) => (
                        <div key={i} className="p-3 bg-black/20 border border-[#2D3748] rounded-xl text-[11px] text-[#94A3B8] italic">
                          "{s}"
                        </div>
                      )) || <p className="text-xs italic text-[#94A3B8]/40">Calibrating output strategy...</p>}
                    </div>
                  </Card>
                </div>
              </div>
            )}
            {activeTab === 'scheduler' && (
              <div className="space-y-6 animate-in slide-in-from-right-5 duration-500">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#F8FAFC]">Activation Queue</h2>
                    <p className="text-[#94A3B8] text-sm italic">Master list of upcoming brand deployments and synchronization timings.</p>
                  </div>
                </div>

                <div className="max-w-4xl">
                  <Card className="shadow-none border-[#2D3748] bg-[#1E232D] rounded-2xl">
                    <CardHeader className="border-b border-[#2D3748] bg-black/10">
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-[#94A3B8]">Scheduled Upload List</CardTitle>
                      <CardDescription className="text-[10px] text-[#94A3B8]/60 uppercase font-bold">Chronological Deployment sequence</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {posts.filter(p => p.status === 'scheduled').length > 0 ? (
                          posts.filter(p => p.status === 'scheduled')
                            .sort((a, b) => new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime())
                            .map((post, i) => (
                            <div key={post.id} className="flex gap-4 p-5 border border-[#2D3748] rounded-xl bg-[#0B0E14]/40 hover:bg-[#0B0E14] transition-all group items-center">
                              <div className="w-12 h-12 rounded-lg bg-[#3B82F6]/10 flex flex-col items-center justify-center border border-[#3B82F6]/20">
                                <span className="text-[10px] font-black text-[#3B82F6]">{i + 1}</span>
                                <Clock className="w-3 h-3 text-[#3B82F6]/50" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-black text-[#F8FAFC] border-[#2D3748] text-[9px] uppercase font-bold px-2">{post.platform}</Badge>
                                    <span className="text-[10px] font-bold text-[#F8FAFC] uppercase tracking-tighter">{post.mediaType} asset</span>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className="text-[11px] font-black text-[#3B82F6] uppercase">Upload at:</span>
                                    <span className="text-[10px] font-mono text-[#10B981] font-bold">
                                      {post.scheduledAt ? format(new Date(post.scheduledAt), 'PPPP p') : 'PENDING'}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[11px] line-clamp-1 text-[#94A3B8] font-medium opacity-80 italic">"{post.content}"</p>
                              </div>
                              <div className="pl-4">
                                <Badge variant="outline" className="border-[#10B981]/30 text-[#10B981] text-[9px] px-2 uppercase font-black">Queued</Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-24 text-center space-y-4">
                            <div className="w-16 h-16 bg-[#2D3748]/20 rounded-full flex items-center justify-center mx-auto border border-[#2D3748]/50">
                              <Calendar className="w-6 h-6 text-[#94A3B8]/20" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[#94A3B8] text-xs font-black uppercase tracking-widest">No deployments scheduled</p>
                              <p className="text-[10px] text-[#94A3B8]/40 font-bold uppercase">Approve assets in the Drafts tab to begin queueing.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mt-8 p-6 bg-[#3B82F6]/5 border border-[#3B82F6]/10 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-5 h-5 text-[#3B82F6]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#F8FAFC] uppercase tracking-widest">Autonomous Sync Engine</h4>
                      <p className="text-[10px] text-[#94A3B8] mt-1 italic">Our squadron monitors these slots 24/7. Once the countdown hits zero, your content is pushed to the target constellation automatically.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </ScrollArea>
      </main>

      {/* Full-screen Image Preview Overlay */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute top-6 right-6 text-white hover:bg-white/10 rounded-full"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-8 h-8" />
          </Button>
          <img 
            src={previewImage} 
            alt="Full screen preview" 
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, trend, icon: Icon }: any) {
  return (
    <Card className="shadow-none border-[#2D3748] bg-[#1E232D] p-6 flex justify-between items-end relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-16 h-16 bg-[#3B82F6]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[#3B82F6]/10 transition-colors" />
      <div className="space-y-1 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">{label}</p>
        <p className="text-2xl font-black tracking-tight text-[#F8FAFC]">{value}</p>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-[#10B981]" />
          <p className="text-[10px] font-bold text-[#10B981]">{trend} index</p>
        </div>
      </div>
      <Icon className="w-6 h-6 text-[#94A3B8]/10 group-hover:text-[#3B82F6]/20 transition-colors" />
    </Card>
  );
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Zap
          key={i}
          className={`w-2.5 h-2.5 ${
            i < Math.round(score / 2) ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#94A3B8]/20'
          }`}
        />
      ))}
    </div>
  );
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'research', label: 'Research', icon: Search },
  { id: 'content', label: 'Drafts', icon: PenTool },
  { id: 'connections', label: 'Connections', icon: Globe },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'scheduler', label: 'Scheduler', icon: Calendar },
];

const mockChartData = [
  { name: 'P1', views: 4000, likes: 2400 },
  { name: 'P2', views: 3000, likes: 1398 },
  { name: 'P3', views: 2000, likes: 9800 },
  { name: 'P4', views: 2780, likes: 3908 },
  { name: 'P5', views: 1890, likes: 4800 },
  { name: 'P6', views: 2390, likes: 3800 },
  { name: 'P7', views: 3490, likes: 4300 },
];

