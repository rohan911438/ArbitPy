import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { 
  Code2, 
  BookOpen, 
  Settings, 
  Info, 
  ChevronLeft,
  ChevronRight,
  Zap,
  Brain,
  Sparkles
} from 'lucide-react';

const menuItems = [
  { id: 'playground', label: 'Playground', icon: Code2 },
  { id: 'examples', label: 'Examples', icon: BookOpen },
  { id: 'arbitpy-ai', label: 'ArbitPy AI', icon: Brain, special: true },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'about', label: 'About', icon: Info },
] as const;

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, activePage, setActivePage } = useAppStore();

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out',
        sidebarOpen ? 'w-56' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        {sidebarOpen && (
          <div>
            <h1 className="text-lg font-bold text-foreground">ArbitPy</h1>
            <p className="text-xs text-muted-foreground">Python → Arbitrum</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={cn(
              'w-full sidebar-item relative',
              activePage === item.id && 'sidebar-item-active',
              item.special && 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 hover:border-purple-500/40'
            )}
          >
            <div className={cn(
              "flex items-center gap-3",
              item.special && "text-purple-400"
            )}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <span className="truncate font-medium">{item.label}</span>
              )}
              {item.special && sidebarOpen && (
                <Sparkles className="w-3 h-3 ml-auto text-purple-400 animate-pulse" />
              )}
            </div>
          </button>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-20 flex items-center justify-center w-6 h-6 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Version info */}
      {sidebarOpen && (
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground">
            v0.1.0 • Arbitrum Sepolia
          </p>
        </div>
      )}
    </aside>
  );
}
