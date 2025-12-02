import { Code2, Cpu, Rocket, CheckCircle } from 'lucide-react';

const steps = [
  {
    step: 1,
    icon: Code2,
    title: 'Write Python Code',
    description: 'Use familiar Python syntax with special decorators like @contract, @public, and @view to define your smart contract logic.',
    code: `@contract
class Token:
    @public
    def transfer(self, to, amt):
        self.balances[msg.sender] -= amt
        self.balances[to] += amt`,
  },
  {
    step: 2,
    icon: Cpu,
    title: 'Compile to Target',
    description: 'Choose your compilation target - Solidity for maximum compatibility or Stylus/Rust for enhanced performance on Arbitrum.',
    code: `// Compiled Solidity
function transfer(address to, uint256 amt) 
    external {
    balances[msg.sender] -= amt;
    balances[to] += amt;
}`,
  },
  {
    step: 3,
    icon: Rocket,
    title: 'Deploy to Arbitrum',
    description: 'Connect your MetaMask wallet and deploy directly to Arbitrum Sepolia testnet with a single click.',
    code: `✓ Contract deployed!
  
Address: 0x742d35Cc...
TX Hash: 0xabc123...
Network: Arbitrum Sepolia`,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-32 relative overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced section header */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 mb-6">
            <Code2 className="w-4 h-4 text-primary animate-bounce-gentle" />
            <span className="text-sm text-primary font-semibold">Revolutionary Development Workflow</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            From Python to{' '}
            <span className="bg-gradient-to-r from-primary via-accent to-primary animate-gradient bg-clip-text text-transparent">
              Production Blockchain
            </span>
            {' '}in Minutes
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Experience the future of smart contract development. Write familiar Python code, 
            and our advanced compiler handles the complex blockchain integration automatically.
          </p>
        </div>

        {/* Enhanced steps with better visual flow */}
        <div className="relative">
          {/* Animated progress line for desktop */}
          <div className="hidden lg:block absolute top-20 left-1/2 w-full h-1 -translate-x-1/2 -translate-y-1/2">
            <div className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full opacity-20" />
            <div className="absolute inset-0 h-full bg-gradient-to-r from-primary to-accent rounded-full animate-pulse-slow" style={{ width: '33%' }} />
          </div>
          
          <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12 relative z-10">
            {steps.map((step, index) => (
              <div key={step.step} className={`relative animate-fade-in`} style={{ animationDelay: `${index * 200}ms` }}>
                {/* Enhanced connector */}
                {index < steps.length - 1 && (
                  <>
                    <div className="hidden lg:block absolute top-20 left-full w-8 xl:w-12 h-0.5 bg-gradient-to-r from-primary/60 to-accent/60 -translate-x-4 xl:-translate-x-6 z-20" />
                    <div className="hidden lg:block absolute top-20 left-full w-3 h-3 bg-primary rounded-full -translate-x-1.5 -translate-y-1 z-30 animate-pulse" />
                  </>
                )}
                
                <div className="group flex flex-col items-center lg:items-start text-center lg:text-left hover-lift">
                  {/* Enhanced step indicator */}
                  <div className="relative mb-8">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary/80 flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:scale-110 transition-all duration-300 animate-glow">
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-r from-accent to-primary text-white text-sm font-bold flex items-center justify-center shadow-lg animate-bounce-gentle">
                      {step.step}
                    </div>
                    {/* Step completion indicator */}
                    <div className="absolute -bottom-2 left-1/2 w-4 h-4 bg-success rounded-full -translate-x-1/2 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Enhanced content */}
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{step.title}</h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed group-hover:text-foreground/80 transition-colors">
                    {step.description}
                  </p>

                  {/* Enhanced code preview */}
                  <div className="w-full bg-gradient-to-br from-card to-secondary/20 rounded-2xl border border-primary/20 overflow-hidden shadow-xl group-hover:shadow-2xl group-hover:border-primary/40 transition-all duration-300 backdrop-blur-sm">
                    <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-secondary/80 to-secondary/60 border-b border-primary/10">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 animate-pulse" />
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                      <span className="text-xs text-primary font-mono font-semibold">Step {step.step}</span>
                    </div>
                    <pre className="p-6 text-sm font-mono text-foreground/90 overflow-x-auto scrollbar-thin bg-gradient-to-br from-card/50 to-transparent">
                      {step.code}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            'No Solidity knowledge required',
            '40% lower gas on Stylus',
            'Real-time error detection',
            'Instant testnet deployment',
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-sm font-medium">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
