import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAppStore } from '@/stores/appStore';
import { 
  Save, 
  RotateCcw, 
  Settings2,
  Code,
  Globe,
  Palette,
  Shield,
  Zap,
  Bell,
  User,
  Database,
  Wifi,
  Monitor
} from 'lucide-react';

export function Settings() {
  const { connectedWallet } = useAppStore();
  
  const [settings, setSettings] = useState({
    // Editor Settings
    editorFontSize: 14,
    tabSize: 4,
    autoLint: true,
    autoSave: true,
    lineNumbers: true,
    wordWrap: false,
    minimap: true,
    
    // Theme Settings
    theme: 'dark',
    accentColor: 'blue',
    
    // Network Settings
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    gasPrice: 'auto',
    
    // AI Settings
    aiEnabled: true,
    aiModel: 'gemini-1.5-flash',
    aiAutoSuggest: true,
    
    // Notifications
    deploymentNotifications: true,
    errorNotifications: true,
    successNotifications: true,
    
    // Privacy & Security
    analyticsEnabled: false,
    crashReporting: true,
    
    // Performance
    cacheEnabled: true,
    preloadExamples: true
  });

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('arbitpy-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('arbitpy-settings', JSON.stringify(settings));
    toast({
      title: 'Settings Saved',
      description: 'Your preferences have been saved',
    });
  };

  const handleReset = () => {
    setSettings({
      editorFontSize: 14,
      tabSize: 4,
      autoLint: true,
      autoSave: true,
      lineNumbers: true,
      wordWrap: false,
      minimap: true,
      theme: 'dark',
      accentColor: 'blue',
      rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
      explorerUrl: 'https://sepolia.arbiscan.io',
      gasPrice: 'auto',
      aiEnabled: true,
      aiModel: 'gemini-1.5-flash',
      aiAutoSuggest: true,
      deploymentNotifications: true,
      errorNotifications: true,
      successNotifications: true,
      analyticsEnabled: false,
      crashReporting: true,
      cacheEnabled: true,
      preloadExamples: true
    });
    toast({
      title: 'Settings Reset',
      description: 'All settings restored to defaults',
    });
  };

  return (
    <div className="h-full overflow-auto scrollbar-thin relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-accent/5 to-primary/5" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Header */}
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                <Settings2 className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-300% bg-clip-text text-transparent">
              Settings & Preferences
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Customize your ArbitPy development environment to match your workflow and preferences.
              {connectedWallet && (
                <span className="block mt-2 text-sm text-primary font-medium">
                  Connected: {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
                </span>
              )}
            </p>
          </div>

          {/* Settings Grid */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Editor Settings */}
            <section className="group relative p-6 rounded-2xl bg-gradient-to-br from-card via-card/80 to-secondary/30 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
                  <Code className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold">Editor & Code</h2>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Font Size</label>
                    <p className="text-xs text-muted-foreground">Editor font size in pixels</p>
                  </div>
                  <input
                    type="number"
                    min={10}
                    max={24}
                    value={settings.editorFontSize}
                    onChange={(e) => setSettings({ ...settings, editorFontSize: Number(e.target.value) })}
                    className="w-20 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Tab Size</label>
                    <p className="text-xs text-muted-foreground">Spaces per indentation</p>
                  </div>
                  <select
                    value={settings.tabSize}
                    onChange={(e) => setSettings({ ...settings, tabSize: Number(e.target.value) })}
                    className="w-20 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                    <option value={8}>8</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto Lint</label>
                    <p className="text-xs text-muted-foreground">Real-time code validation</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.autoLint} 
                    onChange={(checked) => setSettings({ ...settings, autoLint: checked })} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto Save</label>
                    <p className="text-xs text-muted-foreground">Save changes automatically</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.autoSave} 
                    onChange={(checked) => setSettings({ ...settings, autoSave: checked })} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Line Numbers</label>
                    <p className="text-xs text-muted-foreground">Show line numbers in editor</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.lineNumbers} 
                    onChange={(checked) => setSettings({ ...settings, lineNumbers: checked })} 
                  />
                </div>
              </div>
            </section>

            {/* Network Settings */}
            <section className="group relative p-6 rounded-2xl bg-gradient-to-br from-card via-card/80 to-secondary/30 border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:shadow-accent/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30">
                  <Globe className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-xl font-semibold">Network & Blockchain</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium block mb-2">RPC URL</label>
                  <p className="text-xs text-muted-foreground mb-3">Arbitrum Sepolia endpoint</p>
                  <input
                    type="text"
                    value={settings.rpcUrl}
                    onChange={(e) => setSettings({ ...settings, rpcUrl: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-2">Block Explorer</label>
                  <p className="text-xs text-muted-foreground mb-3">Transaction explorer URL</p>
                  <input
                    type="text"
                    value={settings.explorerUrl}
                    onChange={(e) => setSettings({ ...settings, explorerUrl: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-2">Gas Price Strategy</label>
                  <p className="text-xs text-muted-foreground mb-3">Transaction fee estimation</p>
                  <select
                    value={settings.gasPrice}
                    onChange={(e) => setSettings({ ...settings, gasPrice: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="auto">Auto (Recommended)</option>
                    <option value="fast">Fast</option>
                    <option value="standard">Standard</option>
                    <option value="slow">Slow</option>
                  </select>
                </div>
              </div>
            </section>
            
            {/* AI Settings */}
            <section className="group relative p-6 rounded-2xl bg-gradient-to-br from-card via-card/80 to-secondary/30 border border-border/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold">ArbitPy AI Assistant</h2>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">AI Assistant</label>
                    <p className="text-xs text-muted-foreground">Enable AI-powered features</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.aiEnabled} 
                    onChange={(checked) => setSettings({ ...settings, aiEnabled: checked })} 
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-2">AI Model</label>
                  <p className="text-xs text-muted-foreground mb-3">Choose your preferred model</p>
                  <select
                    value={settings.aiModel}
                    onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={!settings.aiEnabled}
                  >
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Advanced)</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto Suggestions</label>
                    <p className="text-xs text-muted-foreground">AI-powered code suggestions</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.aiAutoSuggest} 
                    onChange={(checked) => setSettings({ ...settings, aiAutoSuggest: checked })} 
                    disabled={!settings.aiEnabled}
                  />
                </div>
              </div>
            </section>
            
            {/* Notifications */}
            <section className="group relative p-6 rounded-2xl bg-gradient-to-br from-card via-card/80 to-secondary/30 border border-border/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
                  <Bell className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-xl font-semibold">Notifications</h2>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Deployment Alerts</label>
                    <p className="text-xs text-muted-foreground">Contract deployment notifications</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.deploymentNotifications} 
                    onChange={(checked) => setSettings({ ...settings, deploymentNotifications: checked })} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Error Notifications</label>
                    <p className="text-xs text-muted-foreground">Show compilation errors</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.errorNotifications} 
                    onChange={(checked) => setSettings({ ...settings, errorNotifications: checked })} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Success Messages</label>
                    <p className="text-xs text-muted-foreground">Show success confirmations</p>
                  </div>
                  <ToggleSwitch 
                    checked={settings.successNotifications} 
                    onChange={(checked) => setSettings({ ...settings, successNotifications: checked })} 
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 p-6 rounded-2xl bg-gradient-to-r from-card/50 to-secondary/30 border border-border/50">
            <button
              onClick={handleSave}
              className="group relative flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-200 w-full sm:w-auto"
            >
              <Save className="w-5 h-5" />
              Save All Settings
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            
            <button
              onClick={handleReset}
              className="group relative flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-secondary to-secondary/80 text-foreground font-semibold text-lg border border-border/50 hover:border-border hover:shadow-lg transition-all duration-200 w-full sm:w-auto"
            >
              <RotateCcw className="w-5 h-5" />
              Reset to Defaults
            </button>
          </div>
          
          {/* Settings Info */}
          <div className="text-center mt-8 p-4 rounded-xl bg-secondary/30 border border-border/30">
            <p className="text-sm text-muted-foreground">
              <Shield className="w-4 h-4 inline mr-2" />
              Settings are stored locally in your browser and never shared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
        checked ? 'bg-primary' : 'bg-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
