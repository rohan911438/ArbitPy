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
  Cpu
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
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need to Build on{' '}
            <span className="text-primary">Arbitrum</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete toolkit designed for Python developers entering the world of blockchain development.
          </p>
        </div>

        {/* Main features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Advanced features */}
        <div className="bg-card rounded-2xl border border-border p-8">
          <h3 className="text-xl font-semibold mb-6 text-center">Advanced Capabilities</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {advancedFeatures.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-secondary text-primary mb-3">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-medium mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
