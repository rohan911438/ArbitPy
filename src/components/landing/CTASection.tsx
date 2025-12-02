import { useMetaMask } from '@/hooks/useMetaMask';
import { Rocket, Wallet, Loader2, ArrowRight, Zap } from 'lucide-react';

interface CTASectionProps {
  onLaunchApp: () => void;
}

export function CTASection({ onLaunchApp }: CTASectionProps) {
  const { connectedWallet, connect, isConnecting } = useMetaMask();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-8">
          <Zap className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          Ready to Build the Future?
        </h2>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Join thousands of Python developers already building on Arbitrum. 
          Connect your wallet and start writing smart contracts in minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {connectedWallet ? (
            <button
              onClick={onLaunchApp}
              className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-lg shadow-2xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
            >
              <Rocket className="w-5 h-5" />
              Launch Playground Now
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-lg shadow-2xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wallet className="w-5 h-5" />
              )}
              Connect Wallet to Start
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Trusted by developers building on</p>
          <div className="flex items-center justify-center gap-8 opacity-60">
            <span className="text-lg font-bold">Arbitrum</span>
            <span className="text-lg font-bold">Ethereum</span>
            <span className="text-lg font-bold">Stylus</span>
          </div>
        </div>
      </div>
    </section>
  );
}
