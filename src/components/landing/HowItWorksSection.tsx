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
    <section id="how-it-works" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            From Python to{' '}
            <span className="text-primary">Blockchain</span>
            {' '}in 3 Steps
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ArbitPy makes smart contract development as simple as writing Python code.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-4" />
              )}
              
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                {/* Step number */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                    {step.step}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  {step.description}
                </p>

                {/* Code preview */}
                <div className="w-full bg-card rounded-xl border border-border overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-b border-border">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    <div className="w-2 h-2 rounded-full bg-success" />
                  </div>
                  <pre className="p-4 text-xs font-mono text-muted-foreground overflow-x-auto scrollbar-thin">
                    {step.code}
                  </pre>
                </div>
              </div>
            </div>
          ))}
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
