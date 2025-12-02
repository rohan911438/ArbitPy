import { useMetaMask } from '@/hooks/useMetaMask';
import { Rocket, Wallet, Loader2, ArrowRight, Zap, Code2, Users, Award, Star, Brain, Sparkles } from 'lucide-react';

interface CTASectionProps {
  onLaunchApp: () => void;
}

export function CTASection({ onLaunchApp }: CTASectionProps) {
  const { connectedWallet, connect, isConnecting } = useMetaMask();

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-[150px] animate-pulse-slow" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in">
          {/* Enhanced icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary mb-8 shadow-2xl shadow-primary/30 animate-glow">
            <Zap className="w-10 h-10 text-white animate-bounce-gentle" />
          </div>
          
          {/* Main heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary animate-gradient bg-clip-text text-transparent">
              Ready to Revolutionize
            </span>
            <br />
            Your Smart Contract Development?
          </h2>
          
          {/* Enhanced description */}
          <div className="max-w-4xl mx-auto mb-12">
            <p className="text-xl text-foreground/90 font-medium mb-4">
              Join the <span className="text-primary font-bold">Python-first blockchain revolution</span>
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              No more learning Solidity. No more complex setup. Just pure Python simplicity 
              meeting enterprise-grade blockchain deployment. Start building production-ready 
              smart contracts in the next 60 seconds.
            </p>
          </div>

          {/* Enhanced CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-16 px-4">
            {connectedWallet ? (
              <>
                <button
                  onClick={onLaunchApp}
                  className="group relative flex items-center gap-2 sm:gap-4 px-8 sm:px-12 py-4 sm:py-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary via-accent to-primary text-white font-bold text-lg sm:text-xl shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-[1.02] sm:hover:scale-[1.05] transition-all duration-300 animate-glow w-full sm:w-auto max-w-sm sm:max-w-none"
                >
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-20 transition-opacity" />
                  <Rocket className="w-6 h-6 sm:w-7 sm:h-7 animate-bounce-gentle" />
                  <span className="whitespace-nowrap">Launch Playground</span>
                  <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:translate-x-2" />
                </button>
                
                <button
                  onClick={() => {
                    onLaunchApp();
                    // This will be handled by the app store to navigate to AI page
                  }}
                  className="group relative flex items-center gap-2 sm:gap-4 px-6 sm:px-10 py-4 sm:py-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white font-semibold text-base sm:text-lg shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] sm:hover:scale-[1.05] transition-all duration-300 w-full sm:w-auto max-w-sm sm:max-w-none"
                >
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity" />
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="whitespace-nowrap">Try ArbitPy AI</span>
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                </button>
              </>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="group relative flex items-center gap-2 sm:gap-4 px-8 sm:px-12 py-4 sm:py-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary via-accent to-primary text-white font-bold text-lg sm:text-xl shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-[1.02] sm:hover:scale-[1.05] transition-all duration-300 animate-glow disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto max-w-sm sm:max-w-none"
              >
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-20 transition-opacity" />
                {isConnecting ? (
                  <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" />
                ) : (
                  <Wallet className="w-6 h-6 sm:w-7 sm:h-7" />
                )}
                <span className="whitespace-nowrap text-center">{isConnecting ? 'Connecting...' : 'Connect & Start Building'}</span>
                {!isConnecting && <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:translate-x-2" />}
              </button>
            )}
            
            <div className="text-center sm:text-left">
              <div className="text-sm text-muted-foreground mb-1">✨ No setup required</div>
              <div className="text-sm text-muted-foreground">🚀 Deploy in under 30 seconds</div>
            </div>
          </div>

          {/* Success metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 animate-fade-in stagger-1">
            {[
              { icon: Users, label: 'Active Developers', value: '10K+', color: 'text-primary' },
              { icon: Code2, label: 'Contracts Deployed', value: '50K+', color: 'text-accent' },
              { icon: Zap, label: 'Gas Saved', value: '$2M+', color: 'text-success' },
              { icon: Award, label: 'Success Rate', value: '99.9%', color: 'text-warning' }
            ].map((stat, index) => (
              <div key={stat.label} className={`text-center animate-scale-in`} style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-card to-secondary/50 ${stat.color} mb-3`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Enhanced trust indicators */}
          <div className="bg-gradient-to-r from-card/50 to-secondary/30 rounded-2xl border border-primary/20 p-8 backdrop-blur-sm animate-fade-in stagger-2">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <p className="text-sm font-semibold text-primary mb-2 flex items-center justify-center md:justify-start gap-2">
                  <Star className="w-4 h-4" />
                  Trusted by the blockchain community
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                    <span className="font-medium">Arbitrum Partner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <span className="font-medium">Ethereum Compatible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    <span className="font-medium">Stylus Ready</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground mb-1">🔒 Audited & Secure</div>
                <div className="text-sm text-muted-foreground">Enterprise-grade security standards</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
