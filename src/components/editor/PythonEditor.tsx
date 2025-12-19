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
    <div className="h-full flex flex-col bg-card/30 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 shadow-2xl transition-all duration-300 hover:shadow-primary/5">
      {/* Enhanced Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-card/80 to-card/60 border-b border-border/30">
        <div className="flex items-center gap-3">
          {/* Traffic Light Buttons with hover effect */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm transition-transform hover:scale-110" />
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm transition-transform hover:scale-110" />
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm transition-transform hover:scale-110" />
          </div>
          <div className="h-4 w-px bg-border/50 mx-1" />
          <span className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
            🐍 contract.py
          </span>
        </div>
        
        {/* Enhanced Linter Status */}
        <div className="flex items-center gap-3">
          {linterWarnings.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-warning/10 text-warning rounded-full border border-warning/20 transition-all">
              <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
              <span className="text-xs font-medium">
                {linterWarnings.length} warning{linterWarnings.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <div className="text-xs text-muted-foreground font-mono px-2 py-1 bg-muted/30 rounded">
            Python → Solidity/Stylus
          </div>
        </div>
      </div>
      
      {/* Enhanced Editor Container */}
      <div className="flex-1 relative bg-gradient-to-b from-transparent to-card/5">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={editorCode}
          onChange={(value) => setEditorCode(value || '')}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontWeight: '400',
            lineHeight: 1.5,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            minimap: { 
              enabled: window.innerWidth > 1024,
              scale: 0.8,
              showSlider: 'mouseover'
            },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            padding: { top: 20, bottom: 20, left: 16, right: 16 },
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: true,
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              insertMode: 'replace',
              snippetsPreventQuickSuggestions: false,
            },
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            hover: {
              enabled: true,
              sticky: true,
            },
            contextmenu: true,
            mouseWheelZoom: true,
            renderWhitespace: 'selection',
            occurrencesHighlight: true,
            selectionHighlight: true,
            wordBasedSuggestions: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-card/20 to-background/5">
              <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-card/40 backdrop-blur-md border border-border/30 shadow-lg">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div className="text-center">
                  <span className="text-sm font-medium text-foreground">Initializing Python Editor</span>
                  <p className="text-xs text-muted-foreground mt-1">Loading smart contract features...</p>
                </div>
              </div>
            </div>
          }
        />
        
        {/* Subtle corner accents */}
        <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-primary/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-accent/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
