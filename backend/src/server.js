import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080", "http://localhost:8081"],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080", "http://localhost:8081"],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make Socket.IO available to routes
app.set('socketio', io);

// Import routes
import arbitPyMasterRoutes from './routes/arbitpy-master-simple.js';
import deploymentRoutes from './routes/deployment.js';
import compilerRoutes from './routes/compiler.js';
import aiRoutes from './routes/ai.js';
import executeRoutes from './routes/execute.js';

// Simple logging
const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// API Routes
app.use('/api/v1/arbitpy-master', arbitPyMasterRoutes);
app.use('/api/v1/deploy', deploymentRoutes);
app.use('/api/v1/compile', compilerRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/execute', executeRoutes);

// Basic routes
app.get('/', (req, res) => {
  res.json({
    message: 'ArbitPy Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Basic compilation endpoint
app.post('/api/v1/compile/vyper', async (req, res) => {
  try {
    const { sourceCode, contractName = 'Contract' } = req.body;
    
    if (!sourceCode) {
      return res.status(400).json({
        success: false,
        error: 'Source code is required'
      });
    }
    
    // Mock compilation result
    const mockResult = {
      success: true,
      contractName,
      compiler: 'vyper',
      version: '0.3.7',
      abi: [
        {
          "name": "hello",
          "type": "function",
          "stateMutability": "view",
          "inputs": [],
          "outputs": [{"name": "", "type": "string"}]
        }
      ],
      bytecode: "0x608060405234801561001057600080fd5b5061012f806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063197fe37814602d575b600080fd5b60336047565b604051603e91906080565b60405180910390f35b60606040518060400160405280600d81526020017f48656c6c6f2c20576f726c642100000000000000000000000000000000000000815250905090565b600082825260208201905092915050565b7f48656c6c6f2c20576f726c64210000000000000000000000000000000000000000600082015250565b600060a860c2565b915060c860d2565b60200282019050919050565b6000602082019050919050565b60e160008201516080806000850152506020820151608480828601525060408201516088808286015250606082015160929150",
      compilationTime: 1250,
      estimatedGas: 250000
    };
    
    log(`Vyper compilation request for: ${contractName}`);
    
    // Simulate compilation delay
    setTimeout(() => {
      res.json(mockResult);
    }, 1000);
    
  } catch (error) {
    log(`Compilation error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Compilation failed',
      message: error.message
    });
  }
});

// Basic deployment endpoint
app.post('/api/v1/deploy', async (req, res) => {
  try {
    const { bytecode, abi, network = 'sepolia' } = req.body;
    
    if (!bytecode || !abi) {
      return res.status(400).json({
        success: false,
        error: 'Bytecode and ABI are required'
      });
    }
    
    // Mock deployment result
    const mockResult = {
      success: true,
      contractAddress: '0x' + Math.random().toString(16).substr(2, 40),
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      network,
      gasUsed: '245678',
      deploymentCost: '0.012345',
      explorerUrl: `https://sepolia.etherscan.io/tx/0x${Math.random().toString(16).substr(2, 64)}`
    };
    
    log(`Deployment request for network: ${network}`);
    
    // Simulate deployment delay
    setTimeout(() => {
      res.json(mockResult);
    }, 2000);
    
  } catch (error) {
    log(`Deployment error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Deployment failed',
      message: error.message
    });
  }
});

// Basic AI chat endpoint
app.post('/api/v1/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    // Simple AI responses
    const responses = {
      'token': 'Here\'s a basic ERC20 token template:\n\n```vyper\n# @version ^0.3.7\nfrom vyper.interfaces import ERC20\n\nname: public(String[64])\nsymbol: public(String[32])\ndecimals: public(uint8)\ntotalSupply: public(uint256)\nbalanceOf: public(HashMap[address, uint256])\n\n@external\ndef __init__():\n    self.name = "My Token"\n    self.symbol = "MTK"\n    self.decimals = 18\n    self.totalSupply = 1000000 * 10**18\n    self.balanceOf[msg.sender] = self.totalSupply\n```',
      'nft': 'Here\'s a basic NFT contract template:\n\n```vyper\n# @version ^0.3.7\n\nname: public(String[64])\nsymbol: public(String[32])\ntotalSupply: public(uint256)\nownerOf: public(HashMap[uint256, address])\n\n@external\ndef __init__():\n    self.name = "My NFT"\n    self.symbol = "MNFT"\n\n@external\ndef mint(to: address, tokenId: uint256):\n    assert self.ownerOf[tokenId] == ZERO_ADDRESS\n    self.ownerOf[tokenId] = to\n    self.totalSupply += 1\n```',
      'default': 'I can help you with smart contract development! Try asking about:\n- Creating tokens\n- Building NFT contracts\n- DeFi protocols\n- Contract security\n- Gas optimization\n\nWhat would you like to learn about?'
    };
    
    let response = responses.default;
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('token') || lowerMessage.includes('erc20')) {
      response = responses.token;
    } else if (lowerMessage.includes('nft') || lowerMessage.includes('721')) {
      response = responses.nft;
    }
    
    log(`AI chat request: ${message.substring(0, 50)}...`);
    
    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    log(`AI chat error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'AI request failed',
      message: error.message
    });
  }
});

// Get contract examples
app.get('/api/v1/contracts', (req, res) => {
  const examples = [
    {
      id: 'simple-token',
      name: 'Simple Token',
      description: 'Basic ERC20-like token in Vyper',
      category: 'token',
      code: `# @version ^0.3.7
# Simple Token Contract

name: public(String[64])
symbol: public(String[32])
decimals: public(uint8)
totalSupply: public(uint256)
balanceOf: public(HashMap[address, uint256])

@external
def __init__():
    self.name = "Simple Token"
    self.symbol = "SIM"
    self.decimals = 18
    self.totalSupply = 1000000 * 10**18
    self.balanceOf[msg.sender] = self.totalSupply

@external
def transfer(to: address, amount: uint256) -> bool:
    assert self.balanceOf[msg.sender] >= amount
    self.balanceOf[msg.sender] -= amount
    self.balanceOf[to] += amount
    return True`
    },
    {
      id: 'simple-nft',
      name: 'Simple NFT',
      description: 'Basic NFT contract in Vyper',
      category: 'nft',
      code: `# @version ^0.3.7
# Simple NFT Contract

name: public(String[64])
symbol: public(String[32])
totalSupply: public(uint256)
ownerOf: public(HashMap[uint256, address])
owner: public(address)

@external
def __init__():
    self.name = "Simple NFT"
    self.symbol = "SNFT"
    self.owner = msg.sender

@external
def mint(to: address, tokenId: uint256):
    assert msg.sender == self.owner
    assert self.ownerOf[tokenId] == ZERO_ADDRESS
    self.ownerOf[tokenId] = to
    self.totalSupply += 1`
    },
    {
      id: 'hello-world',
      name: 'Hello World',
      description: 'Simple greeting contract',
      category: 'basic',
      code: `# @version ^0.3.7
# Hello World Contract

greeting: public(String[100])

@external
def __init__():
    self.greeting = "Hello, ArbitPy!"

@view
@external
def getGreeting() -> String[100]:
    return self.greeting

@external
def setGreeting(newGreeting: String[100]):
    self.greeting = newGreeting`
    }
  ];
  
  res.json({
    success: true,
    contracts: examples,
    total: examples.length
  });
});

// Basic WebSocket handling
io.on('connection', (socket) => {
  log(`Client connected: ${socket.id}`);
  
  socket.on('compile_start', (data) => {
    log(`Compilation started by ${socket.id}`);
    
    // Simulate compilation progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      socket.emit('compile_progress', { progress });
      
      if (progress >= 100) {
        clearInterval(interval);
        socket.emit('compile_complete', {
          success: true,
          message: 'Compilation completed successfully'
        });
      }
    }, 500);
  });
  
  socket.on('disconnect', () => {
    log(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  log(`Error: ${err.message}`);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server
server.listen(PORT, () => {
  log(`🚀 ArbitPy Backend running on http://localhost:${PORT}`);
  log(`📡 WebSocket server ready`);
  log(`🎯 Ready to serve requests!`);
});

export default app;