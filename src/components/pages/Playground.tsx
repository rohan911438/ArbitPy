import { PythonEditor } from '@/components/editor/PythonEditor';
import { OutputPanel } from '@/components/output/OutputPanel';

export function Playground() {
  return (
    <div className="h-full flex flex-col lg:grid lg:grid-cols-2 gap-6 p-6 pb-16">
      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className="flex-1 lg:flex-none">
        <PythonEditor />
      </div>
      <div className="flex-1 lg:flex-none">
        <OutputPanel />
      </div>
    </div>
  );
}
