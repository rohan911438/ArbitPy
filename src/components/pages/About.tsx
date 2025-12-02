import { ExternalLink, Github, Twitter, Zap } from 'lucide-react';

export function About() {
  return (
    <div className="h-full overflow-auto scrollbar-thin p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-6">
            <Zap className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-3">ArbitPy</h1>
          <p className="text-lg text-muted-foreground">
            Python-first Smart Contract Toolkit for Arbitrum
          </p>
        </div>

        <div className="space-y-6">
          <section className="p-6 rounded-xl bg-card border border-border">
            <h2 className="text-lg font-semibold mb-3">What is ArbitPy?</h2>
            <p className="text-muted-foreground leading-relaxed">
              ArbitPy is a revolutionary development toolkit that allows you to write smart contracts 
              in Python and compile them to Solidity or Stylus/Rust for deployment on the Arbitrum network. 
              Our goal is to make blockchain development accessible to millions of Python developers worldwide.
            </p>
          </section>

          <section className="p-6 rounded-xl bg-card border border-border">
            <h2 className="text-lg font-semibold mb-3">Features</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span>Write smart contracts in familiar Python syntax</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span>Compile to Solidity for EVM compatibility</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span>Compile to Stylus/Rust for enhanced performance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span>Deploy directly to Arbitrum testnet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span>Real-time linting and error detection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span>MetaMask integration for seamless deployment</span>
              </li>
            </ul>
          </section>

          <section className="p-6 rounded-xl bg-card border border-border">
            <h2 className="text-lg font-semibold mb-3">Technology</h2>
            <div className="flex flex-wrap gap-2">
              {['Python', 'Solidity', 'Rust', 'Stylus', 'Arbitrum', 'React', 'TypeScript'].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>

          <section className="p-6 rounded-xl bg-card border border-border">
            <h2 className="text-lg font-semibold mb-3">Resources</h2>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://arbitrum.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Arbitrum Docs
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <Twitter className="w-4 h-4" />
                Twitter
              </a>
            </div>
          </section>

          <div className="text-center text-sm text-muted-foreground pt-6">
            <p>Version 0.1.0 • Built with ❤️ for the Arbitrum ecosystem</p>
          </div>
        </div>
      </div>
    </div>
  );
}
