import { useState } from 'react';
import { SamplePetSelector } from './SamplePetSelector';
import { TestResultPanel } from './TestResultPanel';
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { SAMPLE_PETS, testPrompt, type TestPetData, type TestResult } from '../../services/promptTesting';
import { FlaskConical } from 'lucide-react';

interface PromptTesterProps {
  systemPrompt: string;
  userPrompt?: string;
}

export function PromptTester({ systemPrompt, userPrompt }: PromptTesterProps) {
  const [pet, setPet] = useState<TestPetData>(SAMPLE_PETS[0]);
  const [complexity, setComplexity] = useState('standard');
  const [language, setLanguage] = useState('English');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await testPrompt(
        systemPrompt,
        userPrompt ?? '',
        pet,
        complexity,
        language,
      );
      setResult(res);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-neutral-50 border border-admin-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical size={16} className="text-admin-accent-500" />
        <h4 className="text-sm font-bold text-neutral-700">Test Prompt</h4>
      </div>

      <SamplePetSelector value={pet} onChange={setPet} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Complexity</label>
          <select
            value={complexity}
            onChange={(e) => setComplexity(e.target.value)}
            className="w-full rounded-lg border-neutral-300 text-sm focus:border-admin-accent-500 focus:ring-admin-accent-500"
          >
            <option value="minimal">Minimal</option>
            <option value="standard">Standard</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg border-neutral-300 text-sm focus:border-admin-accent-500 focus:ring-admin-accent-500"
          >
            <option value="English">English</option>
            <option value="French">French</option>
          </select>
        </div>
      </div>

      <Button
        size="sm"
        onClick={handleTest}
        loading={testing}
        className="w-full"
      >
        Run Test
      </Button>

      {testing && (
        <div className="flex items-center justify-center py-6">
          <LoadingSpinner />
          <span className="ml-2 text-sm text-neutral-500">Running AI test...</span>
        </div>
      )}

      {result && <TestResultPanel result={result} />}
    </div>
  );
}
