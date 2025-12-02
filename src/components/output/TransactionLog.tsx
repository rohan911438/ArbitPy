import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { ChevronUp, ChevronDown, ExternalLink, Copy, Check, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export function TransactionLog() {
  const { 
    transactionLogOpen, 
    setTransactionLogOpen, 
    deployLogs,
    clearDeployLogs 
  } = useAppStore();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast({ title: 'Copied!', description: 'Address copied to clipboard' });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-card border-t border-border transition-all duration-300 ease-in-out z-50',
        transactionLogOpen ? 'h-64' : 'h-10'
      )}
    >
      {/* Header */}
      <button
        onClick={() => setTransactionLogOpen(!transactionLogOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-secondary/50 hover:bg-secondary/70 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm">Transaction Log</span>
          {deployLogs.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
              {deployLogs.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {transactionLogOpen && deployLogs.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearDeployLogs();
                toast({ title: 'Cleared', description: 'Transaction logs cleared' });
              }}
              className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {transactionLogOpen ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      {transactionLogOpen && (
        <div className="h-[calc(100%-40px)] overflow-auto scrollbar-thin p-4">
          {deployLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1">Deploy a contract to see transactions here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deployLogs.map((log, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-lg border animate-slide-up',
                    log.status === 'success' ? 'bg-success/5 border-success/30' :
                    log.status === 'failed' ? 'bg-destructive/5 border-destructive/30' :
                    'bg-warning/5 border-warning/30'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'w-2 h-2 rounded-full',
                          log.status === 'success' ? 'bg-success' :
                          log.status === 'failed' ? 'bg-destructive' :
                          'bg-warning animate-pulse'
                        )} />
                        <span className="text-sm font-medium capitalize">{log.status}</span>
                        <span className="text-xs text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.message}</p>
                      
                      {log.txHash && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">TX:</span>
                          <code className="text-xs font-mono text-primary truncate max-w-[200px]">
                            {log.txHash}
                          </code>
                          <button
                            onClick={() => copyToClipboard(log.txHash!, index)}
                            className="p-1 rounded hover:bg-secondary transition-colors"
                          >
                            {copiedIndex === index ? (
                              <Check className="w-3 h-3 text-success" />
                            ) : (
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            )}
                          </button>
                          <a
                            href={`https://sepolia.arbiscan.io/tx/${log.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-secondary transition-colors"
                          >
                            <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
                          </a>
                        </div>
                      )}
                      
                      {log.contractAddress && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">Contract:</span>
                          <code className="text-xs font-mono text-accent truncate max-w-[200px]">
                            {log.contractAddress}
                          </code>
                          <a
                            href={`https://sepolia.arbiscan.io/address/${log.contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-secondary transition-colors"
                          >
                            <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
