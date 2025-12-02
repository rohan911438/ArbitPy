import { 
  Code2, 
  Zap, 
  Shield, 
  Layers, 
  Terminal, 
  Wallet,
  FileCode,
  Bug,
  Rocket,
  Globe,
  Lock,
  Cpu,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: Code2,
    title: 'Python-First Development',
    description: 'Write smart contracts using familiar Python syntax, classes, and decorators. No need to learn Solidity from scratch.',
    color: 'from-primary to-primary/60',
  },
  {
    icon: Layers,
    title: 'Dual Compilation Targets',
    description: 'Compile to traditional Solidity for EVM compatibility, or to Stylus/Rust for enhanced performance and lower gas costs.',
    color: 'from-accent to-accent/60',
  },
  {
    icon: Terminal,
    title: 'Monaco Code Editor',
    description: 'Professional-grade code editor with syntax highlighting, autocomplete, and real-time error detection.',
    color: 'from-success to-success/60',
  },
  {
    icon: Bug,
    title: 'Built-in Linter',
    description: 'Catch errors before compilation with intelligent linting that understands ArbitPy\'s contract decorators.',
    color: 'from-warning to-warning/60',
  },
  {
    icon: Wallet,
    title: 'MetaMask Integration',
    description: 'Seamlessly connect your wallet, switch to Arbitrum networks, and deploy contracts with one click.',
    color: 'from-primary to-accent',
  },
  {
    icon: Rocket,
    title: 'One-Click Deploy',
    description: 'Deploy directly to Arbitrum Sepolia testnet. View transactions and contract addresses in real-time.',
    color: 'from-destructive to-destructive/60',
  },
];

const advancedFeatures = [
  {
    icon: FileCode,
    title: 'ABI Generation',
    description: 'Automatic ABI extraction for frontend integration',
  },
  {
    icon: Shield,
    title: 'Security Patterns',
    description: 'Built-in security best practices and patterns',
  },
  {
    icon: Globe,
    title: 'Testnet Ready',
    description: 'Pre-configured for Arbitrum Sepolia deployment',
  },
  {
    icon: Lock,
    title: 'Access Control',
    description: 'Easy-to-use decorators for permissions',
  },
  {
    icon: Cpu,
    title: 'Gas Optimization',
    description: 'Optimized output for minimal gas usage',
  },
  {
    icon: Zap,
    title: 'Stylus Support',
    description: 'Compile to Rust for Arbitrum Stylus VMs',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-32 relative overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
      <div className="absolute top-1/3 left-10 w-72 h-72 bg-primary/10 rounded-full blur-[128px] animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-10 w-72 h-72 bg-accent/10 rounded-full blur-[128px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced section header */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Rocket className="w-4 h-4 text-primary animate-bounce-gentle" />
            <span className="text-sm text-primary font-semibold">Powered by Advanced Compilation Technology</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-primary via-accent to-primary animate-gradient bg-clip-text text-transparent">
              Build on Arbitrum
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A revolutionary toolkit that bridges Python and blockchain development. 
            <span className="text-primary font-medium">No Solidity experience required</span> - 
            just write Python and deploy to production.
          </p>
        </div>

        {/* Enhanced main features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16 lg:mb-20">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-gradient-to-br from-card to-card/50 border border-border hover:border-primary/50 transition-all duration-500 hover-lift animate-fade-in backdrop-blur-sm`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                  {feature.description}
                </p>
                
                {/* Learn more indicator */}
                <div className="flex items-center gap-2 mt-4 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-sm font-medium">Learn more</span>
                  <ArrowRight className="w-4 h-4 transform translate-x-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced advanced features showcase */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-3xl blur-xl" />
          <div className="relative bg-gradient-to-br from-card/80 to-secondary/20 rounded-3xl border border-primary/20 p-10 backdrop-blur-xl">
            <div className="text-center mb-8 animate-fade-in stagger-6">
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
                ✨ Advanced Capabilities
              </h3>
              <p className="text-muted-foreground">Production-ready features built for serious blockchain development</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {advancedFeatures.map((feature, index) => (
                <div key={feature.title} className={`text-center group hover-lift animate-scale-in`} style={{ animationDelay: `${600 + index * 100}ms` }}>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary mb-4 group-hover:scale-110 group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300 shadow-lg">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold mb-2 group-hover:text-primary transition-colors">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
