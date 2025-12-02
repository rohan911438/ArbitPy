import { useMetaMask } from '@/hooks/useMetaMask';
import { ArrowRight, Play, Zap, Code2, Rocket, Wallet, Loader2 } from 'lucide-react';

interface HeroSectionProps {
  onLaunchApp: () => void;
}

export function HeroSection({ onLaunchApp }: HeroSectionProps) {
  const { connectedWallet, connect, isConnecting } = useMetaMask();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse-slow" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 mb-6 sm:mb-8 animate-scale-in hover-lift backdrop-blur-sm mx-auto max-w-fit">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-bounce-gentle" />
          <span className="text-xs sm:text-sm text-primary font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">🚀 Built for Arbitrum Stylus & EVM</span>
        </div>

        {/* Main heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight animate-fade-in stagger-1 px-4">
          Build Smart Contracts with
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-primary via-accent to-primary animate-gradient bg-clip-text text-transparent inline-block">
            Python Simplicity
          </span>
        </h1>

        {/* Subtitle */}
        <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto mb-8 sm:mb-12 animate-fade-in stagger-2 px-4">
          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/90 font-medium text-center">
            The first Python-to-blockchain compiler that actually works
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-center">
            Write smart contracts in Python, compile to Solidity or Stylus/Rust, and deploy to Arbitrum. 
            <span className="text-primary font-medium">40% lower gas costs</span>, 
            <span className="text-accent font-medium">10x faster development</span>, 
            and <span className="text-success font-medium">zero learning curve</span> for Python developers.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-20 animate-fade-in stagger-3 px-4">
          {connectedWallet ? (
            <button
              onClick={onLaunchApp}
              className="group relative flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground font-bold text-base sm:text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] sm:hover:scale-[1.05] transition-all duration-300 animate-glow w-full sm:w-auto max-w-xs sm:max-w-none"
            >
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-20 transition-opacity" />
              <Rocket className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce-gentle" />
              <span className="whitespace-nowrap">Launch Playground</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-2" />
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="group relative flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground font-bold text-base sm:text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] sm:hover:scale-[1.05] transition-all duration-300 animate-glow disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto max-w-xs sm:max-w-none"
            >
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-20 transition-opacity" />
              {isConnecting ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              ) : (
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
              <span className="whitespace-nowrap">{isConnecting ? 'Connecting...' : 'Connect Wallet to Start'}</span>
              {!isConnecting && <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-2" />}
            </button>
          )}
          
          <a
            href="#how-it-works"
            className="group flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-5 rounded-xl sm:rounded-2xl border-2 border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 backdrop-blur-sm hover-lift w-full sm:w-auto max-w-xs sm:max-w-none"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="font-semibold whitespace-nowrap">See How It Works</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 opacity-0 -ml-2 transition-all group-hover:opacity-100 group-hover:ml-0" />
          </a>
        </div>

        {/* Code preview */}
        <div className="relative max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 rounded-2xl blur-lg opacity-50" />
          <div className="relative bg-card rounded-xl border border-border overflow-hidden shadow-2xl">
            {/* Window controls */}
            <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <div className="w-3 h-3 rounded-full bg-warning" />
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="ml-3 text-xs text-muted-foreground font-mono">my_token.py</span>
            </div>
            
            {/* Code content */}
            <pre className="p-6 text-left overflow-x-auto scrollbar-thin">
              <code className="text-sm font-mono">
                <span className="text-accent">@contract</span>{'\n'}
                <span className="text-primary">class</span> <span className="text-foreground">MyToken</span>:{'\n'}
                {'    '}<span className="text-primary">def</span> <span className="text-success">__init__</span>(<span className="text-warning">self</span>):{'\n'}
                {'        '}<span className="text-warning">self</span>.name = <span className="text-success">"ArbitPy Token"</span>{'\n'}
                {'        '}<span className="text-warning">self</span>.symbol = <span className="text-success">"APY"</span>{'\n'}
                {'        '}<span className="text-warning">self</span>.balances = {'{}'}{'\n'}
                {'\n'}
                {'    '}<span className="text-accent">@public</span>{'\n'}
                {'    '}<span className="text-primary">def</span> <span className="text-success">transfer</span>(<span className="text-warning">self</span>, to: <span className="text-primary">address</span>, amount: <span className="text-primary">uint256</span>):{'\n'}
                {'        '}<span className="text-warning">self</span>.balances[msg.sender] -= amount{'\n'}
                {'        '}<span className="text-warning">self</span>.balances[to] += amount{'\n'}
              </code>
            </pre>
          </div>
        </div>

        {/* Enhanced Stats with Better Descriptions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mt-16 sm:mt-20 lg:mt-24 animate-fade-in stagger-5 px-4">
          {[
            { 
              label: 'Python Compatibility', 
              value: '100%', 
              icon: Code2, 
              description: 'Full Python syntax support',
              color: 'from-primary to-primary/60'
            },
            { 
              label: 'Compilation Targets', 
              value: '2', 
              icon: Zap, 
              description: 'Solidity + Stylus/Rust',
              color: 'from-accent to-accent/60'
            },
            { 
              label: 'Gas Cost Reduction', 
              value: '40%', 
              icon: Rocket, 
              description: 'vs traditional Solidity',
              color: 'from-success to-success/60'
            },
            { 
              label: 'Deploy Speed', 
              value: '<30s', 
              icon: ArrowRight, 
              description: 'From code to blockchain',
              color: 'from-warning to-warning/60'
            },
          ].map((stat, index) => (
            <div key={stat.label} className={`text-center group hover-lift animate-fade-in`} style={{ animationDelay: `${500 + index * 100}ms` }}>
              <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg shadow-primary/20 mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-xs sm:text-sm font-semibold text-foreground mb-1 leading-tight">{stat.label}</div>
              <div className="text-xs text-muted-foreground hidden sm:block">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
