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
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl backdrop-blur-xl">
      {/* Tabs Header */}
      <div className="relative flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-slate-800/80 via-slate-700/80 to-slate-800/80 border-b border-slate-600/50 overflow-x-auto scrollbar-thin backdrop-blur-sm">
        {/* Background gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5" />
        
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveOutputTab(tab.id)}
            className={cn(
              'relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap transform hover:scale-[1.02] active:scale-[0.98] group',
              activeOutputTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-slate-700/60 hover:bg-slate-600/80 text-slate-300 hover:text-white border border-slate-600/50 hover:border-slate-500/50'
            )}
            style={{ 
              animationDelay: `${index * 50}ms`,
              animation: 'slideInFromLeft 0.3s ease-out forwards'
            }}
          >
            <tab.icon className={cn(
              "w-4 h-4 transition-transform group-hover:rotate-12",
              activeOutputTab === tab.id ? "text-white" : "text-slate-400 group-hover:text-white"
            )} />
            {tab.label}
            {tab.id === 'linter' && linterWarnings.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg animate-pulse">
                {linterWarnings.length}
              </span>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        ))}

        {/* Copy button with enhanced styling */}
        {['solidity', 'rust', 'abi'].includes(activeOutputTab) && (
          <button
            onClick={handleCopy}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 hover:text-white transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] group"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            )}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Content background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50" />
        
        <div className="relative h-full">
          {activeOutputTab === 'linter' ? (
            <LinterView warnings={linterWarnings} />
          ) : activeOutputTab === 'logs' ? (
            <LogsView logs={compileLogs} />
          ) : activeOutputTab === 'deploy' ? (
            <DeploymentPanel />
          ) : activeOutputTab === 'execute' ? (
            <FunctionExecutionPanel />
          ) : (
            <div className="h-full rounded-lg overflow-hidden">
              <Editor
                height="100%"
                language={getLanguage()}
                value={getContent()}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  lineNumbers: 'on',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on',
                  padding: { top: 16, bottom: 16, left: 16, right: 16 },
                  lineHeight: 1.6,
                  renderLineHighlight: 'gutter',
                  selectionHighlight: false,
                  occurrencesHighlight: false,
                  roundedSelection: false,
                  cursorStyle: 'line',
                  cursorBlinking: 'smooth',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LinterView({ warnings }: { warnings: typeof useAppStore.prototype.linterWarnings }) {
  if (warnings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 backdrop-blur-sm border border-emerald-400/20 mb-6">
          <Check className="w-16 h-16 text-emerald-400 mx-auto drop-shadow-lg" />
        </div>
        <h3 className="text-lg font-semibold text-emerald-400 mb-2">All Clear!</h3>
        <p className="text-sm text-slate-300 mb-1">No warnings or errors detected</p>
        <p className="text-xs text-slate-500">Your code is ready to compile</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 overflow-auto scrollbar-thin h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Code Analysis Results</h3>
        <p className="text-sm text-slate-400">{warnings.length} issue{warnings.length !== 1 ? 's' : ''} found</p>
      </div>
      
      {warnings.map((warning, index) => (
        <div
          key={index}
          className={cn(
            'group relative flex items-start gap-4 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] animate-slide-up shadow-lg',
            warning.severity === 'error' 
              ? 'bg-gradient-to-r from-red-500/15 to-red-600/10 border-red-500/30 hover:border-red-400/40' 
              : warning.severity === 'warning'
              ? 'bg-gradient-to-r from-orange-500/15 to-orange-600/10 border-orange-500/30 hover:border-orange-400/40'
              : 'bg-gradient-to-r from-blue-500/15 to-blue-600/10 border-blue-500/30 hover:border-blue-400/40'
          )}
          style={{ animationDelay: `${index * 75}ms` }}
        >
          {/* Icon with glow effect */}
          <div className={cn(
            'p-2 rounded-xl',
            warning.severity === 'error' 
              ? 'bg-red-500/20 shadow-lg shadow-red-500/25' 
              : warning.severity === 'warning'
              ? 'bg-orange-500/20 shadow-lg shadow-orange-500/25'
              : 'bg-blue-500/20 shadow-lg shadow-blue-500/25'
          )}>
            <AlertTriangle className={cn(
              'w-5 h-5 flex-shrink-0',
              warning.severity === 'error' ? 'text-red-400' :
              warning.severity === 'warning' ? 'text-orange-400' : 'text-blue-400'
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white group-hover:text-slate-100 transition-colors">{warning.message}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-md font-mono">
                Line {warning.line}:{warning.column}
              </span>
              <span className={cn(
                'text-xs px-2 py-1 rounded-md font-semibold',
                warning.severity === 'error' 
                  ? 'bg-red-500/20 text-red-400' 
                  : warning.severity === 'warning'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-blue-500/20 text-blue-400'
              )}>
                {warning.severity.toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* Hover glow effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      ))}
    </div>
  );
}

function LogsView({ logs }: { logs: typeof useAppStore.prototype.compileLogs }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-600/20 to-slate-500/10 backdrop-blur-sm border border-slate-500/20 mb-6">
          <ScrollText className="w-16 h-16 text-slate-400 mx-auto drop-shadow-lg" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No Logs Yet</h3>
        <p className="text-sm text-slate-400 mb-1">Compilation logs will appear here</p>
        <p className="text-xs text-slate-500">Start compiling to see detailed logs</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3 overflow-auto scrollbar-thin h-full">
      <div className="mb-4 pb-3 border-b border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-2">Compilation Logs</h3>
        <p className="text-sm text-slate-400">{logs.length} log entr{logs.length !== 1 ? 'ies' : 'y'}</p>
      </div>

      <div className="space-y-2">
        {logs.map((log, index) => (
          <div
            key={index}
            className={cn(
              'group flex items-start gap-3 p-3 rounded-xl transition-all duration-300 hover:scale-[1.01] animate-slide-up border backdrop-blur-sm',
              log.type === 'error' 
                ? 'bg-gradient-to-r from-red-500/15 to-red-600/10 border-red-500/20 hover:border-red-400/30' :
              log.type === 'success' 
                ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-600/10 border-emerald-500/20 hover:border-emerald-400/30' :
              log.type === 'warning' 
                ? 'bg-gradient-to-r from-orange-500/15 to-orange-600/10 border-orange-500/20 hover:border-orange-400/30' 
                : 'bg-gradient-to-r from-slate-600/15 to-slate-700/10 border-slate-600/20 hover:border-slate-500/30'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Status indicator */}
            <div className={cn(
              'w-2 h-2 rounded-full mt-2 flex-shrink-0 shadow-lg',
              log.type === 'error' 
                ? 'bg-red-400 shadow-red-400/50 animate-pulse' :
              log.type === 'success' 
                ? 'bg-emerald-400 shadow-emerald-400/50' :
              log.type === 'warning' 
                ? 'bg-orange-400 shadow-orange-400/50 animate-pulse' 
                : 'bg-slate-400 shadow-slate-400/50'
            )} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-mono text-slate-400 bg-slate-800/50 px-2 py-1 rounded-md">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className={cn(
                  'text-xs px-2 py-1 rounded-md font-semibold',
                  log.type === 'error' 
                    ? 'bg-red-500/20 text-red-400' :
                  log.type === 'success' 
                    ? 'bg-emerald-500/20 text-emerald-400' :
                  log.type === 'warning' 
                    ? 'bg-orange-500/20 text-orange-400' 
                    : 'bg-slate-500/20 text-slate-400'
                )}>
                  {log.type.toUpperCase()}
                </span>
              </div>
              
              <p className={cn(
                'text-sm font-mono group-hover:text-slate-100 transition-colors leading-relaxed',
                log.type === 'error' ? 'text-red-300' :
                log.type === 'success' ? 'text-emerald-300' :
                log.type === 'warning' ? 'text-orange-300' : 'text-slate-300'
              )}>
                {log.message}
              </p>
            </div>
            
            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
