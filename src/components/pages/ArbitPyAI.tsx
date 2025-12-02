import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { toast } from '@/hooks/use-toast';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Code, 
  FileCode, 
  Zap, 
  Brain, 
  MessageCircle, 
  Copy, 
  Check, 
  Loader2,
  User,
  ChevronDown,
  BookOpen,
  Bug,
  Lightbulb,
  Shield,
  Rocket,
  Settings
} from 'lucide-react';

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyBEjSJaPV3Hqc21B7sWmKtO9rlkSJSbDoE';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// Custom styles for enhanced animations
const customStyles = `
  @keyframes typing {
    from { width: 0; }
    to { width: 100%; }
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
    50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
  }
  
  .typing-animation {
    overflow: hidden;
    border-right: 2px solid;
    white-space: nowrap;
    animation: typing 3.5s steps(40, end), blink 0.75s step-end infinite;
  }
  
  .pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .message-fade-in {
    animation: fadeIn 0.5s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .gradient-border {
    position: relative;
    background: linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.1), transparent);
    background-size: 200% 200%;
    animation: gradientShift 3s ease infinite;
  }
  
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('arbitpy-ai-styles')) {
  const style = document.createElement('style');
  style.id = 'arbitpy-ai-styles';
  style.textContent = customStyles;
  document.head.appendChild(style);
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  code?: string;
  loading?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  color: string;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'explain-code',
    label: 'Explain Code',
    icon: <BookOpen className="w-4 h-4" />,
    prompt: 'Please explain this Vyper smart contract code step by step, including its functions, security features, and gas optimizations:',
    color: 'from-blue-500 to-blue-600',
    description: 'Get detailed explanations of smart contract code'
  },
  {
    id: 'debug-contract',
    label: 'Debug Contract',
    icon: <Bug className="w-4 h-4" />,
    prompt: 'Help me debug this Vyper smart contract. Please identify potential issues, vulnerabilities, and suggest improvements:',
    color: 'from-red-500 to-red-600',
    description: 'Find and fix bugs in your contracts'
  },
  {
    id: 'optimize-gas',
    label: 'Optimize Gas',
    icon: <Zap className="w-4 h-4" />,
    prompt: 'Please analyze this Vyper contract for gas optimization opportunities and suggest specific improvements:',
    color: 'from-yellow-500 to-yellow-600',
    description: 'Reduce gas costs and improve efficiency'
  },
  {
    id: 'security-audit',
    label: 'Security Audit',
    icon: <Shield className="w-4 h-4" />,
    prompt: 'Please perform a comprehensive security audit of this Vyper smart contract, identifying vulnerabilities and attack vectors:',
    color: 'from-green-500 to-green-600',
    description: 'Security analysis and vulnerability assessment'
  },
  {
    id: 'generate-contract',
    label: 'Generate Contract',
    icon: <Rocket className="w-4 h-4" />,
    prompt: 'Please generate a complete Vyper smart contract with the following requirements:',
    color: 'from-purple-500 to-purple-600',
    description: 'Create new contracts from specifications'
  },
  {
    id: 'best-practices',
    label: 'Best Practices',
    icon: <Lightbulb className="w-4 h-4" />,
    prompt: 'What are the current best practices for Vyper smart contract development, including security, gas optimization, and code structure?',
    color: 'from-orange-500 to-orange-600',
    description: 'Learn industry standards and recommendations'
  }
];

export function ArbitPyAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { setEditorCode, setActivePage } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simple welcome message
  useEffect(() => {
    setMessages([{
      id: '1',
      type: 'ai',
      content: `Hello! I'm your **ArbitPy AI assistant**, ready to help with Vyper smart contract development.

I can help you with:
• Smart contract development and optimization
• Security analysis and vulnerability detection
• Gas optimization techniques
• Code debugging and explanations
• DeFi protocol patterns and best practices

What would you like to work on today?`,
      timestamp: new Date()
    }]);
  }, []);

  const callGeminiAPI = async (userMessage: string): Promise<string> => {
    const systemPrompt = `You are ArbitPy AI, an expert Vyper smart contract development assistant. You specialize in:

1. **Vyper Smart Contract Development**: Writing secure, gas-efficient Vyper contracts
2. **DeFi Protocols**: DEXs, lending, staking, governance, yield farming
3. **Security Best Practices**: Reentrancy protection, access controls, input validation
4. **Gas Optimization**: Efficient storage patterns, loop optimization, function modifiers
5. **Smart Contract Architecture**: Design patterns, upgradeability, modularity

**Response Guidelines:**
- Provide detailed, actionable advice
- Include code examples when relevant
- Explain security implications
- Suggest gas optimizations
- Use markdown formatting for better readability
- Be conversational but professional
- If asked about non-Vyper topics, gently redirect to Vyper/blockchain development

**Code Formatting:**
- Use \`\`\`vyper for Vyper code blocks
- Include inline comments explaining complex logic
- Follow Vyper best practices and conventions
- Highlight security considerations with ⚠️
- Mark gas optimization tips with ⚡

User Question: ${userMessage}`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I couldn\'t generate a response.';
  };

  const handleSendMessage = async (messageContent: string = input) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: 'Analyzing your request...',
      timestamp: new Date(),
      loading: true
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await callGeminiAPI(messageContent);
      
      // Extract code blocks from response
      const codeMatch = response.match(/```(?:vyper|python)\n([\s\S]*?)\n```/);
      const code = codeMatch ? codeMatch[1] : undefined;

      const aiMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'ai',
        content: response,
        timestamp: new Date(),
        code
      };

      setMessages(prev => prev.slice(0, -1).concat(aiMessage));
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'ai',
        content: '❌ Sorry, I encountered an error while processing your request. Please try again or rephrase your question.',
        timestamp: new Date()
      };
      setMessages(prev => prev.slice(0, -1).concat(errorMessage));
      
      toast({
        title: 'AI Assistant Error',
        description: 'Failed to get response from AI. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    const message = action.prompt;
    setInput(message);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast({
        title: 'Copied to clipboard',
        description: 'Content copied successfully!'
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const loadCodeToEditor = (code: string) => {
    setEditorCode(code);
    setActivePage('playground');
    toast({
      title: 'Code loaded to editor',
      description: 'Contract code has been loaded into the playground!'
    });
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';
    
    return (
      <div
        key={message.id}
        className={`message-fade-in flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6`}
      >
        {/* Simple Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-primary/20 text-primary' 
            : 'bg-purple-500/20 text-purple-400'
        }`}>
          {isUser ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
        </div>

        {/* Clean Message content */}
        <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
          <div className={`inline-block p-4 rounded-xl ${
            isUser 
              ? 'bg-primary/10 border border-primary/20' 
              : 'bg-card border border-border/30'
          }`}>
            {message.loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            ) : (
              <div className="text-sm leading-relaxed">
                {message.content.split('\n').map((line, i) => {
                  // Simple markdown formatting
                  const boldRegex = /\*\*(.*?)\*\*/g;
                  const codeRegex = /`([^`]+)`/g;
                  
                  let formattedLine = line
                    .replace(boldRegex, '<strong class="font-semibold text-foreground">$1</strong>')
                    .replace(codeRegex, '<code class="px-2 py-1 bg-secondary rounded text-xs font-mono">$1</code>');
                  
                  return (
                    <div key={i} dangerouslySetInnerHTML={{ __html: formattedLine }} className="mb-1" />
                  );
                })}
              </div>
            )}
          </div>

          {/* Simplified Code block */}
          {message.code && !message.loading && (
            <div className="mt-3 rounded-lg bg-secondary/50 border border-border/30 overflow-hidden">
              <div className="px-3 py-2 bg-secondary/70 flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">Generated Code</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(message.code!, message.id)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {copiedMessageId === message.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedMessageId === message.id ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => loadCodeToEditor(message.code!)}
                    className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    <FileCode className="w-3 h-3" />
                    Load
                  </button>
                </div>
              </div>
              <pre className="p-3 text-xs font-mono overflow-x-auto bg-secondary/30">
                <code>{message.code}</code>
              </pre>
            </div>
          )}

          {!isUser && (
            <div className="mt-2 text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Simplified background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background to-accent/5" />
      
      {/* Clean header */}
      <div className="relative z-10 border-b border-border/30 bg-card/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  ArbitPy AI Assistant
                </h1>
                <p className="text-sm text-muted-foreground">
                  Smart contract development companion
                </p>
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full text-xs font-medium border border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Online</span>
            </div>
          </div>

          {/* Simplified Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {quickActions.slice(0, 4).map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary/80 border border-border/30 hover:border-primary/30 transition-all duration-200"
                title={action.description}
              >
                <div className="text-primary group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
            
            {/* Show more button for remaining actions */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border/30 text-muted-foreground hover:text-foreground transition-all duration-200">
              <span className="text-sm">+{quickActions.length - 4} more</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clean Messages Area */}
      <div className="flex-1 overflow-auto scrollbar-thin relative z-10">
        <div className="max-w-4xl mx-auto p-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Welcome to ArbitPy AI</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                I'm here to help you with Vyper smart contracts, security audits, gas optimization, and more.
              </p>
              <div className="text-sm text-muted-foreground">
                Try asking: "Help me create an ERC20 token" or "Audit my smart contract"
              </div>
            </div>
          )}
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Clean Input Area */}
      <div className="border-t border-border/30 bg-background/95 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about Vyper contracts, DeFi protocols, security audits, gas optimization..."
              className="flex-1 min-h-[60px] p-3 rounded-lg bg-card border border-border/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder-muted-foreground/60"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-w-[80px] justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Powered by Gemini</span>
            </div>
            <div className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              <span>AI Assistant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}