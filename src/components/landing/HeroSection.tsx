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
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse-slow" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Built for Arbitrum Stylus</span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in" style={{ animationDelay: '100ms' }}>
          Write Smart Contracts
          <br />
          <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            in Python
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '200ms' }}>
          ArbitPy is a Python-first smart contract toolkit that compiles to Solidity or Stylus/Rust. 
          Deploy to Arbitrum with the language you love.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '300ms' }}>
          {connectedWallet ? (
            <button
              onClick={onLaunchApp}
              className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-lg shadow-2xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
            >
              <Rocket className="w-5 h-5" />
              Launch Playground
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-lg shadow-2xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all disabled:opacity-50"
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
          
          <a
            href="#how-it-works"
            className="flex items-center gap-2 px-6 py-4 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
          >
            <Play className="w-5 h-5" />
            See How It Works
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-fade-in" style={{ animationDelay: '500ms' }}>
          {[
            { label: 'Python Syntax', value: '100%', icon: Code2 },
            { label: 'Compile Targets', value: '2', icon: Zap },
            { label: 'Gas Savings', value: '40%', icon: Rocket },
            { label: 'Deploy Time', value: '<30s', icon: ArrowRight },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-2">
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
