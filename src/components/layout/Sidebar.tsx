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
        'relative flex flex-col bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-900/95 border-r border-slate-700/50 transition-all duration-300 ease-in-out backdrop-blur-xl shadow-2xl',
        sidebarOpen ? 'w-64' : 'w-18'
      )}
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-blue-500/5" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

      {/* Logo */}
      <div className="relative flex items-center gap-4 p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-blue-500 shadow-lg shadow-blue-500/25">
          <Zap className="w-6 h-6 text-white drop-shadow-sm" />
        </div>
        {sidebarOpen && (
          <div className="animate-slide-in-left">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
              ArbitPy
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Python → Smart Contracts
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 p-4 space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={cn(
              'group relative w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]',
              activePage === item.id 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                : item.special
                ? 'bg-gradient-to-r from-purple-500/15 to-purple-600/10 text-purple-300 hover:from-purple-500/25 hover:to-purple-600/15 border border-purple-500/20 hover:border-purple-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60 border border-transparent hover:border-slate-600/50'
            )}
            style={{ 
              animationDelay: `${index * 75}ms`,
              animation: 'slideInFromLeft 0.4s ease-out forwards'
            }}
          >
            {/* Icon container */}
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
              activePage === item.id 
                ? "bg-white/20 shadow-md" 
                : item.special
                ? "bg-purple-500/20 group-hover:bg-purple-500/30"
                : "group-hover:bg-slate-600/50"
            )}>
              <item.icon className={cn(
                "w-5 h-5 transition-transform group-hover:rotate-12",
                activePage === item.id 
                  ? "text-white" 
                  : item.special 
                  ? "text-purple-400" 
                  : "text-slate-400 group-hover:text-white"
              )} />
            </div>
            
            {/* Label */}
            {sidebarOpen && (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="truncate">{item.label}</span>
                {item.special && (
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse flex-shrink-0" />
                )}
              </div>
            )}

            {/* Active indicator */}
            {activePage === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-white to-blue-200 rounded-r-full shadow-lg" />
            )}

            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-4 top-24 flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 border border-slate-600/50 text-slate-300 hover:text-white hover:from-slate-600 hover:to-slate-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95"
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Version info */}
      {sidebarOpen && (
        <div className="relative p-4 border-t border-slate-700/50 animate-slide-in-left">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-300">Version 0.1.0</p>
              <p className="text-xs text-slate-500">Arbitrum Sepolia</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
