import Editor from '@monaco-editor/react';
import { useAppStore } from '@/stores/appStore';
import { Loader2 } from 'lucide-react';

export function PythonEditor() {
  const { editorCode, setEditorCode, linterWarnings } = useAppStore();

  const handleEditorMount = (editor: unknown, monaco: unknown) => {
    // Configure Python language features
    const monacoInstance = monaco as {
      languages: {
        setMonarchTokensProvider: (lang: string, config: unknown) => void;
      };
    };
    
    // Add custom Python keywords for smart contracts
    monacoInstance.languages.setMonarchTokensProvider('python', {
      keywords: [
        'def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return',
        'import', 'from', 'as', 'try', 'except', 'finally', 'with',
        'lambda', 'pass', 'break', 'continue', 'and', 'or', 'not',
        'in', 'is', 'True', 'False', 'None', 'self', 'global', 'nonlocal',
        'raise', 'yield', 'assert', 'del'
      ],
      decorators: ['@contract', '@public', '@view', '@payable', '@external', '@internal'],
      typeKeywords: ['address', 'uint256', 'int256', 'bytes32', 'bool', 'string'],
      tokenizer: {
        root: [
          [/@\w+/, 'decorator'],
          [/[a-zA-Z_]\w*/, {
            cases: {
              '@keywords': 'keyword',
              '@typeKeywords': 'type',
              '@default': 'identifier'
            }
          }],
          [/"([^"\\]|\\.)*"/, 'string'],
          [/'([^'\\]|\\.)*'/, 'string'],
          [/"""[\s\S]*?"""/, 'string'],
          [/'''[\s\S]*?'''/, 'string'],
          [/#.*$/, 'comment'],
          [/\d+/, 'number'],
        ]
      }
    });
  };

  return (
    <div className="h-full flex flex-col bg-editor-bg rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <div className="w-3 h-3 rounded-full bg-warning" />
          <div className="w-3 h-3 rounded-full bg-success" />
        </div>
        <span className="text-sm text-muted-foreground font-mono">contract.py</span>
        <div className="flex items-center gap-2">
          {linterWarnings.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded bg-warning/20 text-warning">
              {linterWarnings.length} warning{linterWarnings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={editorCode}
          onChange={(value) => setEditorCode(value || '')}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
          }}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }
        />
      </div>
    </div>
  );
}
