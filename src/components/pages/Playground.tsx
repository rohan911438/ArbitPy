import { PythonEditor } from '@/components/editor/PythonEditor';
import { OutputPanel } from '@/components/output/OutputPanel';

export function Playground() {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 pb-14">
      <PythonEditor />
      <OutputPanel />
    </div>
  );
}
