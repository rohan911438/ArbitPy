import { FileCode, Coins, Image, Vault, Users } from 'lucide-react';

const examples = [
  {
    icon: Coins,
    title: 'ERC20 Token',
    description: 'Complete fungible token implementation with minting, burning, and allowance system',
    tags: ['DeFi', 'Token', 'Standard'],
    codePreview: '@contract\nclass MyToken:\n    def transfer(self, to, amount):\n        self.balances[msg.sender] -= amount\n        self.balances[to] += amount',
    features: ['Mint/Burn', 'Allowances', 'Events'],
    difficulty: 'Beginner',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: Image,
    title: 'NFT Collection',
    description: 'ERC721-compliant NFTs with metadata URI and royalty support',
    tags: ['NFT', 'Art', 'Collectibles'],
    codePreview: '@contract\nclass ArtNFT:\n    @public\n    def mint(self, to, token_id, uri):\n        self.owners[token_id] = to\n        self.token_uris[token_id] = uri',
    features: ['Metadata', 'Royalties', 'Batch Mint'],
    difficulty: 'Intermediate',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Vault,
    title: 'Yield Farming Vault',
    description: 'Advanced DeFi vault with compound interest and reward distribution',
    tags: ['DeFi', 'Yield', 'Staking'],
    codePreview: '@contract\nclass YieldVault:\n    @public\n    def deposit(self, amount):\n        self.update_rewards()\n        self.balances[msg.sender] += amount',
    features: ['Auto-compound', 'Rewards', 'Emergency Withdraw'],
    difficulty: 'Advanced',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Users,
    title: 'DAO Governance',
    description: 'Decentralized governance with proposal creation, voting, and execution',
    tags: ['DAO', 'Governance', 'Voting'],
    codePreview: '@contract\nclass DAO:\n    @public\n    def create_proposal(self, description):\n        proposal_id = self.proposal_count\n        self.proposals[proposal_id] = Proposal(...)',
    features: ['Proposals', 'Voting', 'Timelock'],
    difficulty: 'Advanced',
    color: 'from-orange-500 to-orange-600'
  },
];

export function ExamplesSection() {
  return (
    <section id="examples" className="py-32 relative overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/5 to-background" />
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-accent/15 rounded-full blur-[128px] animate-float" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-primary/15 rounded-full blur-[128px] animate-float" style={{ animationDelay: '1.5s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced section header */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 mb-6">
            <FileCode className="w-4 h-4 text-accent animate-bounce-gentle" />
            <span className="text-sm text-accent font-semibold">Production-Ready Smart Contract Templates</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Launch Faster with{' '}
            <span className="bg-gradient-to-r from-accent via-primary to-accent animate-gradient bg-clip-text text-transparent">
              Battle-Tested Templates
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Skip the boilerplate and start with proven smart contract patterns. 
            Each template includes comprehensive documentation, security best practices, 
            and <span className="text-accent font-medium">gas-optimized implementations</span>.
          </p>
        </div>

        {/* Enhanced examples grid */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-12 lg:mb-16">
          {examples.map((example, index) => (
            <div
              key={example.title}
              className={`group relative p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-gradient-to-br from-card to-card/50 border border-border hover:border-primary/50 transition-all duration-500 hover-lift animate-fade-in backdrop-blur-sm`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${example.color} flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-all duration-300`}>
                      <example.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">{example.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${example.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' : example.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                          {example.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-muted-foreground mb-6 leading-relaxed group-hover:text-foreground/90 transition-colors">
                  {example.description}
                </p>

                {/* Code preview */}
                <div className="mb-6 bg-secondary/30 rounded-xl border border-border/50 overflow-hidden">
                  <div className="px-4 py-2 bg-secondary/50 border-b border-border/50 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="ml-2 text-xs text-muted-foreground font-mono">example.py</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-foreground/80 overflow-x-auto">
                    {example.codePreview}
                  </pre>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">KEY FEATURES</div>
                  <div className="flex flex-wrap gap-2">
                    {example.features.map((feature) => (
                      <span key={feature} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md font-medium">
                        ✓ {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {example.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs rounded-full bg-secondary/60 text-secondary-foreground font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Action button */}
                <button className="w-full px-4 py-3 bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30 rounded-xl font-medium text-sm hover:from-primary/30 hover:to-accent/30 hover:border-primary/50 transition-all duration-300 group-hover:shadow-lg">
                  Try This Template →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced CTA */}
        <div className="text-center animate-fade-in stagger-4">
          <div className="bg-gradient-to-br from-card/50 to-secondary/30 rounded-3xl border border-primary/20 p-10 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
                🚀 Ready to Build Something Amazing?
              </h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                All templates are <span className="text-success font-medium">production-ready</span>, 
                <span className="text-primary font-medium"> fully documented</span>, and 
                <span className="text-accent font-medium">security audited</span>. 
                Start with a template and customize it to your needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                  <FileCode className="w-5 h-5" />
                  <span>15+ Templates Available</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-lg font-medium">
                  <Vault className="w-5 h-5" />
                  <span>Gas Optimized</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg font-medium">
                  <Users className="w-5 h-5" />
                  <span>Community Tested</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
