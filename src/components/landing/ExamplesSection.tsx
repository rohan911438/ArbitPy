import { FileCode, Coins, Image, Vault, Users } from 'lucide-react';

const examples = [
  {
    icon: Coins,
    title: 'ERC20 Token',
    description: 'Fungible token with mint, transfer, and approve functions',
    tags: ['DeFi', 'Token'],
  },
  {
    icon: Image,
    title: 'NFT Collection',
    description: 'Non-fungible tokens with metadata and transfer logic',
    tags: ['NFT', 'Collectibles'],
  },
  {
    icon: Vault,
    title: 'Token Vault',
    description: 'Secure vault for depositing and withdrawing tokens',
    tags: ['DeFi', 'Staking'],
  },
  {
    icon: Users,
    title: 'Crowdfunding',
    description: 'Campaign contract with goals, deadlines, and refunds',
    tags: ['Governance', 'Funding'],
  },
];

export function ExamplesSection() {
  return (
    <section id="examples" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Start with{' '}
            <span className="text-primary">Ready-Made Templates</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our collection of example contracts and learn by example.
          </p>
        </div>

        {/* Examples grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {examples.map((example, index) => (
            <div
              key={example.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <example.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{example.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{example.description}</p>
              <div className="flex flex-wrap gap-2">
                {example.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            All examples are fully functional and ready to customize
          </p>
          <div className="inline-flex items-center gap-2 text-primary font-medium">
            <FileCode className="w-5 h-5" />
            <span>Access all examples in the playground</span>
          </div>
        </div>
      </div>
    </section>
  );
}
