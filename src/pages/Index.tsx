import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Playground } from '@/components/pages/Playground';
import { Examples } from '@/components/pages/Examples';
import { Settings } from '@/components/pages/Settings';
import { About } from '@/components/pages/About';
import { TransactionLog } from '@/components/output/TransactionLog';
import { useAppStore } from '@/stores/appStore';

const Index = () => {
  const { activePage } = useAppStore();

  const renderPage = () => {
    switch (activePage) {
      case 'playground':
        return <Playground />;
      case 'examples':
        return <Examples />;
      case 'settings':
        return <Settings />;
      case 'about':
        return <About />;
      default:
        return <Playground />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-hidden">
          {renderPage()}
        </main>
      </div>
      <TransactionLog />
    </div>
  );
};

export default Index;
