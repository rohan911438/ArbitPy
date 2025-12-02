import { Brain, Sparkles, Zap, Shield, BookOpen, Bug, Lightbulb, Rocket } from 'lucide-react';

const aiFeatures = [
  {
    icon: Brain,
    title: 'Smart Contract Expert',
    description: 'Get instant help with Vyper development, from basic syntax to advanced DeFi patterns',
    color: 'from-purple-500 to-blue-500'
  },
  {
    icon: Shield,
    title: 'Security Analysis',
    description: 'Automated vulnerability detection and security recommendations for your contracts',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Zap,
    title: 'Gas Optimization',
    description: 'AI-powered suggestions to reduce gas costs and improve contract efficiency',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Bug,
    title: 'Debug Assistant',
    description: 'Intelligent debugging help to identify and fix issues in your smart contracts',
    color: 'from-red-500 to-pink-500'
  },
  {
    icon: Rocket,
    title: 'Code Generation',
    description: 'Generate complete smart contracts from natural language specifications',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: BookOpen,
    title: 'Learning Companion',
    description: 'Personalized tutoring and explanations for blockchain development concepts',
    color: 'from-indigo-500 to-purple-500'
  }
];

export function AIFeaturesSection() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-purple-500/5 to-blue-500/5" />
      <div className="absolute top-20 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-20 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 mb-6">
            <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-sm text-purple-400 font-semibold">Powered by Advanced AI</span>
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Meet Your{' '}
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-300% animate-gradient bg-clip-text text-transparent">
              AI-Powered Development
            </span>
            {' '}Assistant
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            ArbitPy AI is your intelligent companion for smart contract development. Get instant help, 
            security audits, gas optimization, and code generation - all powered by advanced AI.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {aiFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-8 rounded-3xl bg-gradient-to-br from-card/80 to-secondary/30 border border-border/50 hover:border-purple-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 animate-fade-in backdrop-blur-sm hover:-translate-y-1"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-current/20`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-bold mb-4 group-hover:text-purple-400 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* AI Demo section */}
        <div className="bg-gradient-to-br from-card/50 to-secondary/30 rounded-3xl border border-purple-500/20 p-10 backdrop-blur-sm animate-fade-in">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-8">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              <span className="text-sm font-semibold text-purple-400">Live AI Assistant</span>
              <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            
            <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Experience the Future of Smart Contract Development
            </h3>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              Our AI assistant understands Vyper, DeFi protocols, security best practices, and gas optimization. 
              It's like having a senior blockchain developer available 24/7.
            </p>

            {/* Sample conversation preview */}
            <div className="bg-secondary/30 rounded-2xl p-6 border border-border/50 max-w-3xl mx-auto">
              <div className="text-left space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                    You
                  </div>
                  <div className="flex-1 bg-primary/10 rounded-lg p-3 text-sm">
                    "Help me optimize this ERC20 contract for gas efficiency"
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 bg-card/50 rounded-lg p-3 text-sm">
                    <div className="font-medium text-purple-400 mb-1">ArbitPy AI:</div>
                    I'll analyze your contract for gas optimizations. Here are 3 key improvements that can save ~15% gas...
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Instant Responses</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" />
                <span>Security Focused</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>Production Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}