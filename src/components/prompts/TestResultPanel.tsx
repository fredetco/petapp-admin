import type { TestResult } from '../../services/promptTesting';
import { Badge } from '../shared/Badge';
import { Clock, Hash, Zap, AlertTriangle } from 'lucide-react';

interface TestResultPanelProps {
  result: TestResult;
}

export function TestResultPanel({ result }: TestResultPanelProps) {
  if (result.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-danger" />
          <span className="font-semibold text-sm text-danger">Test Failed</span>
        </div>
        <p className="text-sm text-red-600">{result.error}</p>
      </div>
    );
  }

  // Try to parse and format the result
  let formattedOutput: string;
  let tasks: Array<{ title: string; category: string; frequency: string }> = [];

  try {
    const parsed = JSON.parse(result.rawOutput);
    const taskList = parsed?.tasks ?? parsed?.response?.tasks ?? [];
    tasks = taskList;
    formattedOutput = JSON.stringify(parsed, null, 2);
  } catch {
    formattedOutput = result.rawOutput;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Hash size={12} />
          <span>{result.taskCount} tasks</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Clock size={12} />
          <span>{result.latencyMs}ms</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Zap size={12} />
          <span>~{result.tokenEstimate} tokens</span>
        </div>
      </div>

      {/* Formatted task list */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-neutral-600">Generated Tasks</h5>
          <div className="grid gap-1.5">
            {tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant={
                  task.category === 'health' ? 'danger' :
                  task.category === 'grooming' ? 'info' :
                  task.category === 'habitat' ? 'success' :
                  'warning'
                }>
                  {task.category}
                </Badge>
                <span className="text-neutral-700">{task.title}</span>
                <span className="text-neutral-400 text-xs ml-auto">{task.frequency}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw output */}
      <details className="group">
        <summary className="text-xs font-semibold text-neutral-500 cursor-pointer hover:text-neutral-700">
          Raw Output
        </summary>
        <pre className="mt-2 text-xs bg-neutral-50 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto text-neutral-600 font-mono">
          {formattedOutput}
        </pre>
      </details>
    </div>
  );
}
