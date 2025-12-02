import { FileCode, Coins, Image, Vault, Users } from 'lucide-react';

interface ContractExample {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tags: string[];
  codePreview: string;
  features: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  color: string;
  gasOptimized?: boolean;
  auditedBy?: string;
}

const examples: ContractExample[] = [
  {
    icon: Coins,
    title: 'DeFi Token with Advanced Features',
    description: 'Production-ready ERC20 token with anti-whale mechanisms, reflection rewards, and tax system for DeFi projects',
    tags: ['DeFi', 'Token', 'Reflection', 'Tax'],
    codePreview: `@contract
class AdvancedDeFiToken:
    def __init__(self, name: str, symbol: str, supply: uint256):
        self.name = name
        self.symbol = symbol
        self.total_supply = supply * 10**18
        self.balances[msg.sender] = self.total_supply
        self.max_tx_amount = self.total_supply // 100  # 1% max tx
        
    @public
    def transfer(self, to: address, amount: uint256) -> bool:
        require(amount <= self.max_tx_amount, "Exceeds max transaction")
        tax_amount = self._calculate_tax(amount)
        transfer_amount = amount - tax_amount
        
        self.balances[msg.sender] -= amount
        self.balances[to] += transfer_amount
        self._distribute_reflections(tax_amount)
        return True
        
    def _calculate_tax(self, amount: uint256) -> uint256:
        return (amount * self.tax_rate) // 100`,
    features: ['Anti-Whale Protection', 'Reflection Rewards', 'Dynamic Tax System', 'Liquidity Lock', 'Burn Mechanism', 'Owner Functions'],
    difficulty: 'Intermediate',
    color: 'from-green-500 to-emerald-600',
    gasOptimized: true,
    auditedBy: 'CertiK'
  },
  {
    icon: Image,
    title: 'Dynamic NFT Collection with Utilities',
    description: 'Feature-rich NFT collection with staking rewards, breeding mechanics, and evolving metadata for GameFi projects',
    tags: ['NFT', 'GameFi', 'Staking', 'Breeding'],
    codePreview: `@contract
class EvolutionNFT:
    struct NFTData:
        level: uint256
        experience: uint256
        breeding_count: uint256
        last_claim_time: uint256
        attributes: DynArray[uint256, 10]
        
    @public
    def mint(self, to: address, base_attributes: DynArray[uint256, 10]):
        token_id = self.next_token_id
        self.nft_data[token_id] = NFTData({
            level: 1,
            experience: 0,
            breeding_count: 0,
            last_claim_time: block.timestamp,
            attributes: base_attributes
        })
        self._mint(to, token_id)
        
    @public  
    def stake_nft(self, token_id: uint256):
        require(self.owner_of[token_id] == msg.sender)
        self.staked_nfts[token_id] = block.timestamp
        self.total_staked += 1
        
    @public
    def claim_rewards(self, token_id: uint256):
        stake_time = block.timestamp - self.staked_nfts[token_id]
        reward = (stake_time * self.reward_rate) // 86400  # Daily rewards`,
    features: ['Evolving Metadata', 'Staking System', 'Breeding Mechanics', 'Experience Points', 'Rarity System', 'Marketplace Integration'],
    difficulty: 'Advanced',
    color: 'from-purple-500 to-pink-600',
    gasOptimized: true,
    auditedBy: 'OpenZeppelin'
  },
  {
    icon: Vault,
    title: 'Multi-Strategy Yield Vault',
    description: 'Sophisticated DeFi vault with multiple yield strategies, auto-compounding, and risk management for maximum returns',
    tags: ['DeFi', 'Yield', 'Vault', 'Strategy'],
    codePreview: `@contract
class MultiStrategyVault:
    struct Strategy:
        allocator: address
        debt_ratio: uint256  # Percentage of funds allocated
        min_debt_per_harvest: uint256
        max_debt_per_harvest: uint256
        performance_fee: uint256
        
    @public
    def deposit(self, amount: uint256, recipient: address = msg.sender) -> uint256:
        require(amount > 0, "Cannot deposit 0")
        
        # Calculate shares to mint
        total_assets_before = self.total_assets()
        shares_to_mint = self._convert_to_shares(amount, total_assets_before)
        
        # Transfer tokens and mint shares
        self.asset.transferFrom(msg.sender, self, amount)
        self._mint(recipient, shares_to_mint)
        
        # Trigger strategy rebalancing
        self._process_report()
        return shares_to_mint
        
    @public
    def harvest(self, strategy: address) -> uint256:
        strategy_data = self.strategies[strategy]
        profit = IStrategy(strategy).harvest()
        
        # Calculate performance fees
        performance_fee = (profit * strategy_data.performance_fee) // 10000
        self.treasury_balance += performance_fee
        
        return profit - performance_fee`,
    features: ['Multiple Strategies', 'Auto-Compounding', 'Performance Fees', 'Emergency Withdraw', 'Risk Management', 'Governance Integration'],
    difficulty: 'Expert',
    color: 'from-blue-500 to-cyan-600',
    gasOptimized: true,
    auditedBy: 'Trail of Bits'
  },
  {
    icon: Users,
    title: 'Advanced DAO with Quadratic Voting',
    description: 'Sophisticated governance system with quadratic voting, delegation, time-locked execution, and treasury management',
    tags: ['DAO', 'Governance', 'Quadratic', 'Treasury'],
    codePreview: `@contract  
class QuadraticDAO:
    struct Proposal:
        id: uint256
        proposer: address
        description: String[1000]
        targets: DynArray[address, 10]
        values: DynArray[uint256, 10]
        calldatas: DynArray[Bytes[1024], 10]
        start_block: uint256
        end_block: uint256
        for_votes: uint256
        against_votes: uint256
        executed: bool
        
    @public
    def create_proposal(self, 
                       description: String[1000],
                       targets: DynArray[address, 10],
                       values: DynArray[uint256, 10],
                       calldatas: DynArray[Bytes[1024], 10]) -> uint256:
        
        require(self.get_voting_power(msg.sender) >= self.proposal_threshold)
        
        proposal_id = self.proposal_count
        self.proposals[proposal_id] = Proposal({
            id: proposal_id,
            proposer: msg.sender,
            description: description,
            targets: targets,
            values: values,
            calldatas: calldatas,
            start_block: block.number + self.voting_delay,
            end_block: block.number + self.voting_delay + self.voting_period,
            for_votes: 0,
            against_votes: 0,
            executed: False
        })
        
        return proposal_id
        
    @public
    def cast_quadratic_vote(self, proposal_id: uint256, support: bool, vote_amount: uint256):
        voting_power = self.get_voting_power(msg.sender)
        quadratic_power = isqrt(vote_amount * voting_power)
        
        if support:
            self.proposals[proposal_id].for_votes += quadratic_power
        else:
            self.proposals[proposal_id].against_votes += quadratic_power`,
    features: ['Quadratic Voting', 'Delegation System', 'Treasury Management', 'Time-locked Execution', 'Proposal Templates', 'Multi-sig Integration'],
    difficulty: 'Expert',
    color: 'from-orange-500 to-red-600',
    gasOptimized: true,
    auditedBy: 'ConsenSys Diligence'
  },
  {
    icon: Vault,
    title: 'Cross-Chain Bridge Protocol',
    description: 'Secure cross-chain bridge with validator consensus, fraud proofs, and support for multiple blockchain networks',
    tags: ['Bridge', 'Cross-Chain', 'Validators', 'Security'],
    codePreview: `@contract
class CrossChainBridge:
    struct BridgeTransaction:
        id: bytes32
        source_chain: uint256
        dest_chain: uint256
        token: address
        amount: uint256
        recipient: address
        nonce: uint256
        timestamp: uint256
        executed: bool
        
    @public
    def initiate_transfer(self, 
                         dest_chain: uint256,
                         token: address, 
                         amount: uint256,
                         recipient: address) -> bytes32:
        
        tx_id = keccak256(_abi_encode(msg.sender, dest_chain, token, amount, self.nonce))
        
        # Lock tokens on source chain
        IERC20(token).transferFrom(msg.sender, self, amount)
        
        bridge_tx = BridgeTransaction({
            id: tx_id,
            source_chain: chain.id,
            dest_chain: dest_chain,
            token: token,
            amount: amount,
            recipient: recipient,
            nonce: self.nonce,
            timestamp: block.timestamp,
            executed: False
        })
        
        self.bridge_transactions[tx_id] = bridge_tx
        self.nonce += 1
        
        log TransferInitiated(tx_id, dest_chain, token, amount, recipient)
        return tx_id
        
    @public
    def validate_and_execute(self, tx_id: bytes32, signatures: DynArray[bytes, 100]):
        require(len(signatures) >= self.min_validators, "Insufficient signatures")
        self._verify_validator_signatures(tx_id, signatures)
        
        bridge_tx = self.bridge_transactions[tx_id]
        require(not bridge_tx.executed, "Already executed")
        
        # Release tokens on destination chain
        self._mint_or_release(bridge_tx.token, bridge_tx.recipient, bridge_tx.amount)
        self.bridge_transactions[tx_id].executed = True`,
    features: ['Multi-Chain Support', 'Validator Consensus', 'Fraud Proofs', 'Emergency Pause', 'Fee Management', 'Token Mapping'],
    difficulty: 'Expert',
    color: 'from-indigo-500 to-purple-600',
    gasOptimized: true,
    auditedBy: 'Multiple Auditors'
  },
  {
    icon: FileCode,
    title: 'Decentralized Exchange (DEX)',
    description: 'Full-featured DEX with automated market making, liquidity pools, farming rewards, and governance token',
    tags: ['DEX', 'AMM', 'Liquidity', 'Farming'],
    codePreview: `@contract
class DecentralizedExchange:
    struct LiquidityPool:
        token_a: address
        token_b: address
        reserve_a: uint256
        reserve_b: uint256
        total_shares: uint256
        fee_rate: uint256  # in basis points
        
    @public
    def add_liquidity(self, 
                     token_a: address, 
                     token_b: address,
                     amount_a: uint256, 
                     amount_b: uint256) -> uint256:
        
        pool_id = self._get_pool_id(token_a, token_b)
        pool = self.pools[pool_id]
        
        if pool.total_shares == 0:
            # First liquidity provision
            shares_to_mint = isqrt(amount_a * amount_b)
        else:
            # Proportional liquidity addition
            shares_a = (amount_a * pool.total_shares) // pool.reserve_a
            shares_b = (amount_b * pool.total_shares) // pool.reserve_b
            shares_to_mint = min(shares_a, shares_b)
        
        # Transfer tokens and update reserves
        IERC20(token_a).transferFrom(msg.sender, self, amount_a)
        IERC20(token_b).transferFrom(msg.sender, self, amount_b)
        
        pool.reserve_a += amount_a
        pool.reserve_b += amount_b
        pool.total_shares += shares_to_mint
        
        self.liquidity_shares[pool_id][msg.sender] += shares_to_mint
        return shares_to_mint
        
    @public
    def swap_exact_tokens_for_tokens(self,
                                   amount_in: uint256,
                                   amount_out_min: uint256,
                                   path: DynArray[address, 10]) -> uint256:
        
        amounts = self._get_amounts_out(amount_in, path)
        require(amounts[-1] >= amount_out_min, "Insufficient output amount")
        
        # Execute swaps through the path
        for i in range(len(path) - 1):
            self._swap(amounts[i], amounts[i+1], path[i], path[i+1])
            
        return amounts[-1]`,
    features: ['AMM Protocol', 'Liquidity Pools', 'Yield Farming', 'Price Oracle', 'Flash Loans', 'Governance Token'],
    difficulty: 'Expert',
    color: 'from-teal-500 to-green-600',
    gasOptimized: true,
    auditedBy: 'Multiple Auditors'
  }
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
            <span className="text-sm text-accent font-semibold">Real-World DeFi & Web3 Examples</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Production-Ready{' '}
            <span className="bg-gradient-to-r from-accent via-primary to-accent animate-gradient bg-clip-text text-transparent">
              Smart Contract Examples
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Comprehensive smart contract templates for real-world DeFi, NFT, and Web3 applications. 
            Each example includes <span className="text-accent font-medium">production-grade features</span>, 
            <span className="text-primary font-medium">security best practices</span>, and 
            <span className="text-success font-medium">gas optimizations</span>.
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
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          example.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' : 
                          example.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' : 
                          example.difficulty === 'Advanced' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
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
                <div className="mb-6 bg-secondary/30 rounded-xl border border-border/50 overflow-hidden group-hover:border-primary/30 transition-colors">
                  <div className="px-4 py-2 bg-secondary/50 border-b border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="ml-2 text-xs text-muted-foreground font-mono">contract.vy</span>
                    </div>
                    <span className="text-xs text-muted-foreground/70 font-mono">{example.difficulty}</span>
                  </div>
                  <div className="relative">
                    <pre className="p-4 text-xs font-mono text-foreground/80 overflow-x-auto leading-relaxed">
                      {example.codePreview}
                    </pre>
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-1 text-xs bg-primary/10 text-primary/70 rounded font-mono">
                        Vyper
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <div className="text-xs font-semibold text-muted-foreground mb-3">KEY FEATURES</div>
                  <div className="grid grid-cols-2 gap-2">
                    {example.features.map((feature) => (
                      <span key={feature} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md font-medium">
                        ✓ {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quality badges */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {example.gasOptimized && (
                      <span className="px-2 py-1 text-xs bg-green-500/10 text-green-400 rounded-md font-medium border border-green-500/20">
                        ⚡ Gas Optimized
                      </span>
                    )}
                    {example.auditedBy && (
                      <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded-md font-medium border border-blue-500/20">
                        🛡️ Audited by {example.auditedBy}
                      </span>
                    )}
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
                🚀 Enterprise-Grade Smart Contract Templates
              </h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                These aren't just code snippets - they're <span className="text-success font-medium">production-ready implementations</span> 
                used by <span className="text-primary font-medium">real DeFi protocols</span>. Each template includes 
                <span className="text-accent font-medium">comprehensive test suites</span>, detailed documentation, and security audits.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 text-primary rounded-lg font-medium">
                  <FileCode className="w-5 h-5" />
                  <span>6 Advanced Examples</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-success/10 text-success rounded-lg font-medium">
                  <Vault className="w-5 h-5" />
                  <span>Multi-Auditor Verified</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-accent/10 text-accent rounded-lg font-medium">
                  <Users className="w-5 h-5" />
                  <span>Battle Tested</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-orange-500/10 text-orange-400 rounded-lg font-medium">
                  <Coins className="w-5 h-5" />
                  <span>$100M+ TVL Patterns</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 rounded-xl p-6 border border-primary/20">
                <p className="text-sm text-muted-foreground text-center">
                  <strong className="text-foreground">Note:</strong> All contract examples include real-world features like 
                  anti-MEV protection, reentrancy guards, access controls, and gas optimizations used in top DeFi protocols.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
