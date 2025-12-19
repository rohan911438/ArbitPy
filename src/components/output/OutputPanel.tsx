import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { Copy, Check, FileCode, Terminal, Braces, AlertTriangle, ScrollText, Rocket, Play } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Editor from '@monaco-editor/react';
import DeploymentPanel from './DeploymentPanel';
import FunctionExecutionPanel from './FunctionExecutionPanel';

const tabs = [
  { id: 'solidity', label: 'Solidity', icon: FileCode },
  { id: 'rust', label: 'Stylus/Rust', icon: Terminal },
  { id: 'abi', label: 'ABI', icon: Braces },
  { id: 'deploy', label: 'Deploy', icon: Rocket },
  { id: 'execute', label: 'Execute', icon: Play },
  { id: 'linter', label: 'Linter', icon: AlertTriangle },
  { id: 'logs', label: 'Compile Log', icon: ScrollText },
];

export function OutputPanel() {
  const {
    activeOutputTab,
    setActiveOutputTab,
    compiledSolidity,
    compiledRust,
    abiOutput,
    linterWarnings,
    compileLogs,
  } = useAppStore();

  const [copied, setCopied] = useState(false);

  const getContent = () => {
    switch (activeOutputTab) {
      case 'solidity':
        return compiledSolidity || '// Compiled Solidity will appear here\n// Click "Compile to Solidity" to start';
      case 'rust':
        return compiledRust || '// Compiled Stylus/Rust will appear here\n// Click "Compile to Stylus" to start';
      case 'abi':
        return abiOutput || '// ABI will appear here after compilation';
      case 'deploy':
        return null; // Special case for deployment panel
      case 'execute':
        return null; // Special case for function execution panel
      default:
        return '';
    }
  };

  const getLanguage = () => {
    switch (activeOutputTab) {
      case 'solidity':
        return 'sol';
      case 'rust':
        return 'rust';
      case 'abi':
        return 'json';
      default:
        return 'plaintext';
    }
  };

  const handleCopy = async () => {
    const content = getContent();
    if (!content) return;
    
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Code copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-output-bg rounded-lg overflow-hidden border border-border">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-2 py-2 bg-secondary/30 border-b border-border overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveOutputTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap',
              activeOutputTab === tab.id
                ? 'tab-active'
                : 'tab-inactive'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === 'linter' && linterWarnings.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-warning/20 text-warning">
                {linterWarnings.length}
              </span>
            )}
          </button>
        ))}

        {/* Copy button */}
        {['solidity', 'rust', 'abi'].includes(activeOutputTab) && (
          <button
            onClick={handleCopy}
            className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeOutputTab === 'linter' ? (
          <LinterView warnings={linterWarnings} />
        ) : activeOutputTab === 'logs' ? (
          <LogsView logs={compileLogs} />
        ) : activeOutputTab === 'deploy' ? (
          <DeploymentPanel />
        ) : activeOutputTab === 'execute' ? (
          <FunctionExecutionPanel />
        ) : (
          <Editor
            height="100%"
            language={getLanguage()}
            value={getContent()}
            theme="vs-dark"
            options={{
              readOnly: true,
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              lineNumbers: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 },
            }}
          />
        )}
      </div>
    </div>
  );
}

function LinterView({ warnings }: { warnings: typeof useAppStore.prototype.linterWarnings }) {
  if (warnings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Check className="w-12 h-12 mb-3 text-success" />
        <p className="text-sm">No warnings or errors</p>
        <p className="text-xs mt-1">Your code looks good!</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2 overflow-auto scrollbar-thin h-full">
      {warnings.map((warning, index) => (
        <div
          key={index}
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg border animate-slide-up',
            warning.severity === 'error' 
              ? 'bg-destructive/10 border-destructive/30' 
              : warning.severity === 'warning'
              ? 'bg-warning/10 border-warning/30'
              : 'bg-primary/10 border-primary/30'
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <AlertTriangle className={cn(
            'w-4 h-4 mt-0.5 flex-shrink-0',
            warning.severity === 'error' ? 'text-destructive' :
            warning.severity === 'warning' ? 'text-warning' : 'text-primary'
          )} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">{warning.message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Line {warning.line}, Column {warning.column}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LogsView({ logs }: { logs: typeof useAppStore.prototype.compileLogs }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <ScrollText className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">No compile logs yet</p>
        <p className="text-xs mt-1">Compile your contract to see logs here</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2 overflow-auto scrollbar-thin h-full font-mono text-sm">
      {logs.map((log, index) => (
        <div
          key={index}
          className={cn(
            'flex items-start gap-2 animate-slide-up',
            log.type === 'error' ? 'text-destructive' :
            log.type === 'success' ? 'text-success' :
            log.type === 'warning' ? 'text-warning' : 'text-muted-foreground'
          )}
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            [{log.timestamp.toLocaleTimeString()}]
          </span>
          <span>{log.message}</span>
        </div>
      ))}
    </div>
  );
}
