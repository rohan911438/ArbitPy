import { useMetaMask } from '@/hooks/useMetaMask';
import { Zap, Wallet, Loader2, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  onLaunchApp: () => void;
}

export function Navbar({ onLaunchApp }: NavbarProps) {
  const { 
    connectedWallet, 
    connect, 
    disconnect, 
    isConnecting,
    isNetworkSupported,
    network 
  } = useMetaMask();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Examples', href: '#examples' },
    { label: 'Wallet Demo', href: '/wallet-demo' },
    { label: 'Docs', href: '#docs' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-primary to-primary/60">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-bold">ArbitPy</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {connectedWallet ? (
              <>
                <button
                  onClick={disconnect}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
                  title={`${network || 'Unknown network'} - Click to disconnect`}
                >
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    isNetworkSupported() ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="font-mono text-xs">
                    {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
                  </span>
                  {!isNetworkSupported() && (
                    <span className="text-xs text-yellow-600">!</span>
                  )}
                </button>
                <button
                  onClick={onLaunchApp}
                  className="action-button-primary"
                >
                  Launch App
                </button>
              </>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="action-button-primary"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                Connect Wallet
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-border">
              {connectedWallet ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="font-mono text-xs">{connectedWallet.slice(0, 10)}...</span>
                  </div>
                  <button onClick={onLaunchApp} className="w-full action-button-primary justify-center">
                    Launch App
                  </button>
                </div>
              ) : (
                <button onClick={connect} disabled={isConnecting} className="w-full action-button-primary justify-center">
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
