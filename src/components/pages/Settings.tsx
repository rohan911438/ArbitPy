import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Save, RotateCcw } from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState({
    editorFontSize: 14,
    tabSize: 4,
    autoLint: true,
    theme: 'dark',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
  });

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
      theme: 'dark',
      rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
      explorerUrl: 'https://sepolia.arbiscan.io',
    });
    toast({
      title: 'Settings Reset',
      description: 'Settings restored to defaults',
    });
  };

  return (
    <div className="h-full overflow-auto scrollbar-thin p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Configure your ArbitPy development environment.
          </p>
        </div>

        <div className="space-y-6">
          {/* Editor Settings */}
          <section className="p-5 rounded-xl bg-card border border-border">
            <h2 className="text-lg font-semibold mb-4">Editor</h2>
            <div className="space-y-4">
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
                  className="w-20 px-3 py-1.5 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Tab Size</label>
                  <p className="text-xs text-muted-foreground">Number of spaces per tab</p>
                </div>
                <select
                  value={settings.tabSize}
                  onChange={(e) => setSettings({ ...settings, tabSize: Number(e.target.value) })}
                  className="w-20 px-3 py-1.5 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Auto Lint</label>
                  <p className="text-xs text-muted-foreground">Automatically lint code on change</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, autoLint: !settings.autoLint })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.autoLint ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.autoLint ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Network Settings */}
          <section className="p-5 rounded-xl bg-card border border-border">
            <h2 className="text-lg font-semibold mb-4">Network</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">RPC URL</label>
                <input
                  type="text"
                  value={settings.rpcUrl}
                  onChange={(e) => setSettings({ ...settings, rpcUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2">Block Explorer URL</label>
                <input
                  type="text"
                  value={settings.explorerUrl}
                  onChange={(e) => setSettings({ ...settings, explorerUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="action-button-primary"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
            <button
              onClick={handleReset}
              className="action-button-secondary"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
