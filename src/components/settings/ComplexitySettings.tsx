import { useState, useEffect } from 'react';
import { useAllSettings, useUpdateSetting } from '../../hooks/useSettings';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { Save } from 'lucide-react';

export function ComplexitySettings() {
  const { data: settings = [], isLoading } = useAllSettings();
  const updateMutation = useUpdateSetting();

  const [maxMinimal, setMaxMinimal] = useState(8);
  const [maxStandard, setMaxStandard] = useState(16);
  const [maxDetailed, setMaxDetailed] = useState(25);
  const [defaultComplexity, setDefaultComplexity] = useState('standard');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings.length > 0) {
      for (const s of settings) {
        const val = typeof s.value === 'string' ? s.value.replace(/"/g, '') : s.value;
        if (s.key === 'max_tasks_minimal') setMaxMinimal(Number(val));
        if (s.key === 'max_tasks_standard') setMaxStandard(Number(val));
        if (s.key === 'max_tasks_detailed') setMaxDetailed(Number(val));
        if (s.key === 'default_complexity') setDefaultComplexity(String(val));
      }
    }
  }, [settings]);

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      </Card>
    );
  }

  const handleSave = async () => {
    await Promise.all([
      updateMutation.mutateAsync({ key: 'max_tasks_minimal', value: maxMinimal }),
      updateMutation.mutateAsync({ key: 'max_tasks_standard', value: maxStandard }),
      updateMutation.mutateAsync({ key: 'max_tasks_detailed', value: maxDetailed }),
      updateMutation.mutateAsync({ key: 'default_complexity', value: `"${defaultComplexity}"` }),
    ]);
    setDirty(false);
  };

  return (
    <Card>
      <h4 className="text-sm font-bold text-neutral-700 mb-4">Complexity Configuration</h4>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Default Complexity for New Users</label>
          <select
            value={defaultComplexity}
            onChange={(e) => { setDefaultComplexity(e.target.value); setDirty(true); }}
            className="w-full rounded-xl border-neutral-300 text-sm focus:border-admin-accent-500 focus:ring-admin-accent-500"
          >
            <option value="minimal">Minimal</option>
            <option value="standard">Standard</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-green-600 mb-1">Max Tasks — Minimal</label>
            <input
              type="number"
              value={maxMinimal}
              onChange={(e) => { setMaxMinimal(Number(e.target.value)); setDirty(true); }}
              min={1}
              max={50}
              className="w-full rounded-xl border-neutral-300 text-sm focus:border-admin-accent-500 focus:ring-admin-accent-500"
            />
            <p className="text-xs text-neutral-400 mt-0.5">5-8 recommended</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-amber-600 mb-1">Max Tasks — Standard</label>
            <input
              type="number"
              value={maxStandard}
              onChange={(e) => { setMaxStandard(Number(e.target.value)); setDirty(true); }}
              min={1}
              max={50}
              className="w-full rounded-xl border-neutral-300 text-sm focus:border-admin-accent-500 focus:ring-admin-accent-500"
            />
            <p className="text-xs text-neutral-400 mt-0.5">10-16 recommended</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-blue-600 mb-1">Max Tasks — Detailed</label>
            <input
              type="number"
              value={maxDetailed}
              onChange={(e) => { setMaxDetailed(Number(e.target.value)); setDirty(true); }}
              min={1}
              max={50}
              className="w-full rounded-xl border-neutral-300 text-sm focus:border-admin-accent-500 focus:ring-admin-accent-500"
            />
            <p className="text-xs text-neutral-400 mt-0.5">15-25 recommended</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            size="sm"
            icon={<Save size={14} />}
            loading={updateMutation.isPending}
            disabled={!dirty}
            onClick={handleSave}
          >
            Save Settings
          </Button>
          {dirty && <span className="text-xs text-admin-accent-500">Unsaved changes</span>}
        </div>
      </div>
    </Card>
  );
}
