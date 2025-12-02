import { 
  ExternalLink, 
  Github, 
  Twitter, 
  Zap, 
  Download, 
  Copy, 
  Book, 
  Code, 
  Terminal, 
  Rocket, 
  Shield, 
  ChevronRight,
  Package,
  PlayCircle,
  FileText,
  Users,
  Star,
  Activity,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Globe,
  Cpu,
  Database,
  Settings,
  ArrowUpRight,
  Layers
} from 'lucide-react';
import { useState } from 'react';

const navigationSections = [
  {
    title: "Getting Started",
    items: [
      { id: "overview", label: "Overview", icon: Book },
      { id: "installation", label: "Installation", icon: Download },
      { id: "quickstart", label: "Quick Start", icon: Rocket },
      { id: "authentication", label: "Authentication", icon: Shield }
    ]
  },
  {
    title: "SDK Reference",
    items: [
      { id: "client", label: "ArbitPy Client", icon: Code },
      { id: "decorators", label: "Decorators", icon: Layers },
      { id: "compiler", label: "Compiler API", icon: Cpu },
      { id: "deployer", label: "Deployer", icon: Rocket }
    ]
  },
  {
    title: "Examples",
    items: [
      { id: "basic-contract", label: "Basic Contract", icon: PlayCircle },
      { id: "erc20-token", label: "ERC20 Token", icon: Package },
      { id: "nft-collection", label: "NFT Collection", icon: Star },
      { id: "defi-vault", label: "DeFi Vault", icon: Database }
    ]
  },
  {
    title: "Resources",
    items: [
      { id: "changelog", label: "Changelog", icon: Clock },
      { id: "contributing", label: "Contributing", icon: Users },
      { id: "support", label: "Support", icon: Info },
      { id: "github", label: "GitHub", icon: Github }
    ]
  }
];

const codeExamples = {
  installation: `# Install ArbitPy SDK
pip install arbitpy

# Or using conda
conda install -c arbitpy arbitpy

# Development version from GitHub
pip install git+https://github.com/arbitpy/arbitpy.git`,

  quickstart: `from arbitpy import ArbitPy, contract
from arbitpy.decorators import public, view

# Initialize ArbitPy client
client = ArbitPy(
    network="arbitrum-sepolia",
    wallet_key="your-private-key"
)

# Define your contract
@contract
class MyToken:
    def __init__(self, name: str, symbol: str):
        self.name = name
        self.symbol = symbol
        self.balances = {}
    
    @public
    def transfer(self, to: address, amount: uint256):
        self.balances[msg.sender] -= amount
        self.balances[to] += amount
    
    @view
    def balance_of(self, owner: address) -> uint256:
        return self.balances.get(owner, 0)

# Compile and deploy
contract = client.compile(MyToken)
deployed = client.deploy(contract, "ArbitPy Token", "APY")
print(f"Contract deployed at: {deployed.address}")`,

  client: `from arbitpy import ArbitPy

# Initialize with network
client = ArbitPy("arbitrum-sepolia")

# Initialize with custom RPC
client = ArbitPy(
    rpc_url="https://sepolia-rollup.arbitrum.io/rpc",
    chain_id=421614
)

# Set wallet
client.set_wallet("0x" + "your_private_key")

# Or use mnemonic
client.set_mnemonic("your twelve word mnemonic phrase...")`,

  decorators: `from arbitpy.decorators import *

@contract
class MyContract:
    @public  # External function callable by anyone
    def public_function(self):
        pass
    
    @internal  # Internal function, contract only
    def internal_function(self):
        pass
    
    @view  # Read-only function, no state changes
    def get_value(self) -> uint256:
        return self.value
    
    @pure  # Pure function, no state access
    def calculate(self, x: uint256, y: uint256) -> uint256:
        return x + y
    
    @payable  # Function can receive ETH
    def deposit(self):
        self.balance += msg.value
    
    @owner_only  # Restricted to contract owner
    def admin_function(self):
        pass
    
    @event  # Event declaration
    def Transfer(from_addr: address, to: address, value: uint256):
        pass`,

  compiler: `from arbitpy import Compiler

# Initialize compiler
compiler = Compiler()

# Compile to Solidity
solidity_code = compiler.to_solidity(MyContract)
print(solidity_code)

# Compile to Stylus/Rust
rust_code = compiler.to_stylus(MyContract)
print(rust_code)

# Get ABI
abi = compiler.get_abi(MyContract)
print(abi)

# Compile with optimization
bytecode = compiler.compile(
    MyContract,
    target="solidity",
    optimize=True,
    optimization_runs=200
)`
};

const releaseNotes = [
  {
    version: "v1.2.0",
    date: "2024-12-01",
    type: "major",
    changes: [
      "Added Stylus/Rust compilation support",
      "Enhanced type checking and validation",
      "New @payable and @owner_only decorators",
      "Improved gas optimization"
    ]
  },
  {
    version: "v1.1.5",
    date: "2024-11-15",
    type: "patch",
    changes: [
      "Fixed deployment issue on Arbitrum mainnet",
      "Updated dependencies for security",
      "Improved error messages"
    ]
  },
  {
    version: "v1.1.0",
    date: "2024-11-01",
    type: "minor",
    changes: [
      "Added support for events and logging",
      "New contract templates",
      "Performance improvements"
    ]
  }
];

export function About() {
  const [activeSection, setActiveSection] = useState("overview");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-border">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">ArbitPy SDK</h1>
                <p className="text-lg text-muted-foreground">Python-first Smart Contract Development Kit</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Book className="w-5 h-5 text-primary" />
                    What is ArbitPy?
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    ArbitPy is a comprehensive Python SDK that enables developers to write, compile, and deploy 
                    smart contracts using familiar Python syntax. It bridges the gap between Python's simplicity 
                    and blockchain's complexity, targeting the Arbitrum ecosystem.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">Python Native</div>
                        <div className="text-sm text-muted-foreground">Pure Python syntax</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">Multi-Target</div>
                        <div className="text-sm text-muted-foreground">Solidity + Stylus</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">Gas Optimized</div>
                        <div className="text-sm text-muted-foreground">40% cost reduction</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">Production Ready</div>
                        <div className="text-sm text-muted-foreground">Battle tested</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-primary" />
                    Key Features
                  </h2>
                  <div className="space-y-4">
                    {[
                      {
                        title: "Python-First Development",
                        description: "Write smart contracts using familiar Python syntax, classes, and decorators",
                        icon: Code
                      },
                      {
                        title: "Dual Compilation Targets", 
                        description: "Compile to Solidity for EVM compatibility or Stylus/Rust for performance",
                        icon: Cpu
                      },
                      {
                        title: "Integrated Testing Framework",
                        description: "Built-in testing utilities with pytest integration and gas profiling",
                        icon: Shield
                      },
                      {
                        title: "One-Click Deployment",
                        description: "Deploy to Arbitrum networks with automatic verification and monitoring",
                        icon: Globe
                      }
                    ].map((feature) => (
                      <div key={feature.title} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                          <feature.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    SDK Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Version</span>
                      <span className="font-mono text-sm bg-primary/10 px-2 py-1 rounded">v1.2.0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Downloads</span>
                      <span className="font-semibold">125K+</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">GitHub Stars</span>
                      <span className="font-semibold">2.3K</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Contributors</span>
                      <span className="font-semibold">45</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Latest Release
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm bg-success/10 text-success px-2 py-1 rounded">
                        {releaseNotes[0].version}
                      </span>
                      <span className="text-xs text-muted-foreground">{releaseNotes[0].date}</span>
                    </div>
                    <div className="space-y-2">
                      {releaseNotes[0].changes.slice(0, 2).map((change, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">{change}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setActiveSection("changelog")}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      View full changelog <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-primary" />
                    Quick Links
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "GitHub Repository", icon: Github, href: "https://github.com/arbitpy/arbitpy" },
                      { label: "PyPI Package", icon: Package, href: "https://pypi.org/project/arbitpy" },
                      { label: "Discord Community", icon: Users, href: "#" },
                      { label: "Twitter Updates", icon: Twitter, href: "#" }
                    ].map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <link.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{link.label}</span>
                        <ArrowUpRight className="w-3 h-3 text-muted-foreground ml-auto" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "installation":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Installation</h1>
              <p className="text-lg text-muted-foreground">Get started with ArbitPy SDK in minutes</p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-card border border-border">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  Install via pip (Recommended)
                </h2>
                <div className="relative">
                  <pre className="bg-secondary/50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <code>{codeExamples.installation}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeExamples.installation, "installation")}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-background/80 hover:bg-background transition-colors"
                  >
                    {copiedCode === "installation" ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" />
                    System Requirements
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-success" />
                      Python 3.8+ (3.10+ recommended)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-success" />
                      Node.js 16+ (for Stylus compilation)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-success" />
                      Git (for development version)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-success" />
                      4GB RAM minimum
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Verification
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-secondary/30 p-3 rounded-lg">
                      <code className="text-sm font-mono">arbitpy --version</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Run this command to verify your installation. You should see the version number.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-500 mb-1">Development Setup</h3>
                    <p className="text-sm text-muted-foreground">
                      For development, install in editable mode with dev dependencies:
                    </p>
                    <code className="text-sm bg-yellow-500/10 px-2 py-1 rounded mt-2 inline-block">
                      pip install -e ".[dev]"
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "quickstart":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Quick Start Guide</h1>
              <p className="text-lg text-muted-foreground">Build and deploy your first contract in 5 minutes</p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-card border border-border">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-primary" />
                  Your First Contract
                </h2>
                <div className="relative">
                  <pre className="bg-secondary/50 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-96">
                    <code>{codeExamples.quickstart}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeExamples.quickstart, "quickstart")}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-background/80 hover:bg-background transition-colors"
                  >
                    {copiedCode === "quickstart" ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    step: "1",
                    title: "Import & Initialize",
                    description: "Import ArbitPy and set up your client with network configuration",
                    icon: Download
                  },
                  {
                    step: "2", 
                    title: "Define Contract",
                    description: "Write your contract using Python classes and ArbitPy decorators",
                    icon: Code
                  },
                  {
                    step: "3",
                    title: "Compile & Deploy",
                    description: "Compile to your target and deploy to Arbitrum with one command",
                    icon: Rocket
                  }
                ].map((item) => (
                  <div key={item.step} className="p-6 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {item.step}
                      </div>
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-500 mb-1">Next Steps</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Explore more examples in the Examples section</li>
                      <li>• Learn about advanced decorators and features</li>
                      <li>• Set up testing for your contracts</li>
                      <li>• Deploy to mainnet when ready</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "client":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">ArbitPy Client</h1>
              <p className="text-lg text-muted-foreground">The main interface for ArbitPy SDK</p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-card border border-border">
                <h2 className="text-xl font-semibold mb-4">Client Initialization</h2>
                <div className="relative">
                  <pre className="bg-secondary/50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <code>{codeExamples.client}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeExamples.client, "client")}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-background/80 hover:bg-background transition-colors"
                  >
                    {copiedCode === "client" ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold mb-4">Available Networks</h3>
                  <div className="space-y-2">
                    {[
                      { name: "arbitrum-one", desc: "Arbitrum One Mainnet", status: "live" },
                      { name: "arbitrum-sepolia", desc: "Arbitrum Sepolia Testnet", status: "testnet" },
                      { name: "arbitrum-nova", desc: "Arbitrum Nova", status: "live" },
                      { name: "stylus-testnet", desc: "Stylus Testnet", status: "beta" }
                    ].map((network) => (
                      <div key={network.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                        <div>
                          <div className="font-mono text-sm">{network.name}</div>
                          <div className="text-xs text-muted-foreground">{network.desc}</div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          network.status === 'live' ? 'bg-green-500/20 text-green-500' :
                          network.status === 'testnet' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {network.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold mb-4">Client Methods</h3>
                  <div className="space-y-3">
                    {[
                      { method: "compile()", desc: "Compile Python contract to target" },
                      { method: "deploy()", desc: "Deploy compiled contract" },
                      { method: "call()", desc: "Call contract function" },
                      { method: "estimate_gas()", desc: "Estimate gas for transaction" },
                      { method: "get_balance()", desc: "Get account balance" },
                      { method: "get_transaction()", desc: "Get transaction details" }
                    ].map((item) => (
                      <div key={item.method} className="flex items-start gap-3">
                        <code className="text-sm bg-primary/10 text-primary px-2 py-1 rounded font-mono">
                          {item.method}
                        </code>
                        <span className="text-sm text-muted-foreground">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "decorators":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Decorators Reference</h1>
              <p className="text-lg text-muted-foreground">Python decorators for smart contract development</p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-card border border-border">
                <h2 className="text-xl font-semibold mb-4">Available Decorators</h2>
                <div className="relative">
                  <pre className="bg-secondary/50 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-96">
                    <code>{codeExamples.decorators}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeExamples.decorators, "decorators")}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-background/80 hover:bg-background transition-colors"
                  >
                    {copiedCode === "decorators" ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    category: "Function Modifiers",
                    decorators: [
                      { name: "@public", desc: "Makes function callable externally" },
                      { name: "@internal", desc: "Restricts to internal calls only" },
                      { name: "@view", desc: "Read-only, no state modifications" },
                      { name: "@pure", desc: "No state access, pure computation" }
                    ]
                  },
                  {
                    category: "Access Control",
                    decorators: [
                      { name: "@owner_only", desc: "Restricts to contract owner" },
                      { name: "@payable", desc: "Function can receive ETH" },
                      { name: "@nonreentrant", desc: "Prevents reentrancy attacks" },
                      { name: "@paused", desc: "Can be paused by admin" }
                    ]
                  }
                ].map((category) => (
                  <div key={category.category} className="p-6 rounded-xl bg-card border border-border">
                    <h3 className="font-semibold mb-4">{category.category}</h3>
                    <div className="space-y-3">
                      {category.decorators.map((dec) => (
                        <div key={dec.name} className="flex items-start gap-3">
                          <code className="text-sm bg-primary/10 text-primary px-2 py-1 rounded font-mono flex-shrink-0">
                            {dec.name}
                          </code>
                          <span className="text-sm text-muted-foreground">{dec.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "compiler":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Compiler API</h1>
              <p className="text-lg text-muted-foreground">Low-level compilation interface</p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-card border border-border">
                <h2 className="text-xl font-semibold mb-4">Compiler Usage</h2>
                <div className="relative">
                  <pre className="bg-secondary/50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <code>{codeExamples.compiler}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeExamples.compiler, "compiler")}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-background/80 hover:bg-background transition-colors"
                  >
                    {copiedCode === "compiler" ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold mb-4">Compilation Targets</h3>
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h4 className="font-medium text-primary mb-2">Solidity</h4>
                      <p className="text-sm text-muted-foreground">
                        Compiles to Solidity for maximum EVM compatibility. Best for standard DeFi applications.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                      <h4 className="font-medium text-accent mb-2">Stylus/Rust</h4>
                      <p className="text-sm text-muted-foreground">
                        Compiles to Rust for Arbitrum Stylus. Offers better performance and lower gas costs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold mb-4">Optimization Levels</h3>
                  <div className="space-y-3">
                    {[
                      { level: "0", desc: "No optimization, fastest compilation" },
                      { level: "1", desc: "Basic optimization, balanced" },
                      { level: "2", desc: "Aggressive optimization, slower build" },
                      { level: "3", desc: "Maximum optimization, production ready" }
                    ].map((opt) => (
                      <div key={opt.level} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                          <span className="text-sm font-mono">{opt.level}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{opt.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "changelog":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Changelog</h1>
              <p className="text-lg text-muted-foreground">Release history and updates</p>
            </div>

            <div className="space-y-4">
              {releaseNotes.map((release) => (
                <div key={release.version} className="p-6 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-mono ${
                        release.type === 'major' ? 'bg-red-500/20 text-red-500' :
                        release.type === 'minor' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        {release.version}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs uppercase font-medium ${
                        release.type === 'major' ? 'bg-red-500/10 text-red-500' :
                        release.type === 'minor' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-green-500/10 text-green-500'
                      }`}>
                        {release.type}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">{release.date}</span>
                  </div>
                  <div className="space-y-2">
                    {release.changes.map((change, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{change}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
              <p className="text-muted-foreground">This section is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-card border-r border-border p-4 overflow-y-auto scrollbar-thin">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">ArbitPy SDK</span>
          </div>
          <p className="text-xs text-muted-foreground">v1.2.0 Documentation</p>
        </div>

        <div className="space-y-6">
          {navigationSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      activeSection === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-8 max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
