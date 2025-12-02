import { useAppStore } from '@/stores/appStore';
import { toast } from '@/hooks/use-toast';
import { FileCode, ArrowRight } from 'lucide-react';

const examples = [
  {
    id: 'erc20',
    name: 'ERC20 Token',
    description: 'A basic fungible token with mint, transfer, and approve functions',
    code: `# ERC20 Token Implementation
@contract
class ERC20Token:
    def __init__(self):
        self.name = "My Token"
        self.symbol = "MTK"
        self.decimals = 18
        self.total_supply = 0
        self.balances = {}
        self.allowances = {}
    
    @public
    def mint(self, to: address, amount: uint256):
        self.balances[to] = self.balances.get(to, 0) + amount
        self.total_supply += amount
        emit Transfer(address(0), to, amount)
    
    @public
    @view
    def balance_of(self, account: address) -> uint256:
        return self.balances.get(account, 0)
    
    @public
    def transfer(self, to: address, amount: uint256) -> bool:
        sender = msg.sender
        require(self.balances.get(sender, 0) >= amount, "Insufficient balance")
        self.balances[sender] -= amount
        self.balances[to] = self.balances.get(to, 0) + amount
        emit Transfer(sender, to, amount)
        return True`,
  },
  {
    id: 'nft',
    name: 'Simple NFT',
    description: 'A basic non-fungible token (ERC721-like) implementation',
    code: `# Simple NFT Contract
@contract
class SimpleNFT:
    def __init__(self):
        self.name = "My NFT Collection"
        self.symbol = "MNFT"
        self.owners = {}  # token_id -> owner
        self.token_uris = {}  # token_id -> uri
        self.next_token_id = 0
    
    @public
    def mint(self, to: address, uri: string) -> uint256:
        token_id = self.next_token_id
        self.owners[token_id] = to
        self.token_uris[token_id] = uri
        self.next_token_id += 1
        emit Transfer(address(0), to, token_id)
        return token_id
    
    @public
    @view
    def owner_of(self, token_id: uint256) -> address:
        require(token_id in self.owners, "Token does not exist")
        return self.owners[token_id]
    
    @public
    def transfer(self, to: address, token_id: uint256):
        require(self.owners[token_id] == msg.sender, "Not owner")
        self.owners[token_id] = to
        emit Transfer(msg.sender, to, token_id)`,
  },
  {
    id: 'vault',
    name: 'Token Vault',
    description: 'A vault contract for depositing and withdrawing tokens',
    code: `# Token Vault Contract
@contract
class TokenVault:
    def __init__(self):
        self.balances = {}  # user -> amount
        self.total_deposited = 0
    
    @public
    @payable
    def deposit(self):
        amount = msg.value
        user = msg.sender
        self.balances[user] = self.balances.get(user, 0) + amount
        self.total_deposited += amount
        emit Deposit(user, amount)
    
    @public
    def withdraw(self, amount: uint256):
        user = msg.sender
        balance = self.balances.get(user, 0)
        require(balance >= amount, "Insufficient balance")
        self.balances[user] -= amount
        self.total_deposited -= amount
        send(user, amount)
        emit Withdraw(user, amount)
    
    @public
    @view
    def get_balance(self, user: address) -> uint256:
        return self.balances.get(user, 0)`,
  },
  {
    id: 'crowdfund',
    name: 'Crowdfunding',
    description: 'A simple crowdfunding contract with goal and deadline',
    code: `# Crowdfunding Contract
@contract
class Crowdfund:
    def __init__(self):
        self.owner = address(0)
        self.goal = 0
        self.deadline = 0
        self.pledges = {}
        self.total_pledged = 0
        self.claimed = False
    
    @public
    def initialize(self, goal: uint256, duration: uint256):
        require(self.owner == address(0), "Already initialized")
        self.owner = msg.sender
        self.goal = goal
        self.deadline = block.timestamp + duration
    
    @public
    @payable
    def pledge(self):
        require(block.timestamp < self.deadline, "Campaign ended")
        amount = msg.value
        self.pledges[msg.sender] = self.pledges.get(msg.sender, 0) + amount
        self.total_pledged += amount
        emit Pledge(msg.sender, amount)
    
    @public
    def claim(self):
        require(msg.sender == self.owner, "Not owner")
        require(block.timestamp >= self.deadline, "Campaign not ended")
        require(self.total_pledged >= self.goal, "Goal not reached")
        require(not self.claimed, "Already claimed")
        self.claimed = True
        send(self.owner, self.total_pledged)`,
  },
];

export function Examples() {
  const { setEditorCode, setActivePage } = useAppStore();

  const loadExample = (code: string, name: string) => {
    setEditorCode(code);
    setActivePage('playground');
    toast({
      title: 'Example Loaded',
      description: `${name} loaded into editor`,
    });
  };

  return (
    <div className="h-full overflow-auto scrollbar-thin p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Example Contracts</h1>
          <p className="text-muted-foreground">
            Browse and load example Python smart contracts to get started quickly.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {examples.map((example) => (
            <div
              key={example.id}
              className="group relative p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                  <FileCode className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    {example.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {example.description}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => loadExample(example.code, example.name)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all group"
              >
                <span className="text-sm font-medium">Load Example</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
