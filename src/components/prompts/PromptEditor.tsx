import { useState, useRef, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { AIPrompt } from '../../types/prompt';
import { VariableToolbar } from './VariableToolbar';
import { VersionHistory } from './VersionHistory';
import { PromptTester } from './PromptTester';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { useSavePrompt, useActivatePrompt, useArchivePrompt, usePromptsByKey } from '../../hooks/usePrompts';
import { Save, Zap, Archive, FlaskConical } from 'lucide-react';

interface PromptEditorProps {
  prompt: AIPrompt;
  onUpdated: () => void;
}

const statusVariant = {
  active: 'success' as const,
  draft: 'warning' as const,
  archived: 'default' as const,
};

export function PromptEditor({ prompt, onUpdated }: PromptEditorProps) {
  const [editorContent, setEditorContent] = useState(prompt.prompt_text);
  const [title, setTitle] = useState(prompt.title);
  const [description, setDescription] = useState(prompt.description ?? '');
  const [dirty, setDirty] = useState(false);
  const [showTester, setShowTester] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const { data: versions = [] } = usePromptsByKey(prompt.prompt_key);
  const saveMutation = useSavePrompt();
  const activateMutation = useActivatePrompt();
  const archiveMutation = useArchivePrompt();

  // Reset when prompt changes
  const [prevId, setPrevId] = useState(prompt.id);
  if (prompt.id !== prevId) {
    setPrevId(prompt.id);
    setEditorContent(prompt.prompt_text);
    setTitle(prompt.title);
    setDescription(prompt.description ?? '');
    setDirty(false);
  }

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleInsertVariable = useCallback((variable: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = editor.getSelection();
    if (selection) {
      editor.executeEdits('insert-variable', [{
        range: selection,
        text: variable,
      }]);
    }
    editor.focus();
  }, []);

  const handleSave = async () => {
    await saveMutation.mutateAsync({
      id: prompt.id,
      prompt_text: editorContent,
      old_text: prompt.prompt_text,
      title: title !== prompt.title ? title : undefined,
      description: description !== (prompt.description ?? '') ? description : undefined,
    });
    setDirty(false);
    onUpdated();
  };

  const handleActivate = async () => {
    if (dirty) await handleSave();
    await activateMutation.mutateAsync(prompt.id);
    onUpdated();
  };

  const handleArchive = async () => {
    await archiveMutation.mutateAsync(prompt.id);
    onUpdated();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-admin-border bg-white">
        <div className="flex items-center gap-3 mb-3">
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
            className="text-lg font-bold text-neutral-800 bg-transparent border-none p-0 focus:ring-0 flex-1"
            placeholder="Prompt title"
          />
          <Badge variant={statusVariant[prompt.status]}>
            {prompt.status} v{prompt.version}
          </Badge>
        </div>

        <input
          value={description}
          onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
          className="text-sm text-neutral-500 bg-transparent border-none p-0 focus:ring-0 w-full"
          placeholder="Description (optional)"
        />

        <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
          <span>Key: <code className="bg-neutral-100 px-1.5 py-0.5 rounded">{prompt.prompt_key}</code></span>
        </div>
      </div>

      {/* Variable toolbar */}
      <div className="px-6 border-b border-admin-border bg-neutral-50">
        <VariableToolbar onInsert={handleInsertVariable} />
      </div>

      {/* Monaco editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          value={editorContent}
          onChange={(value) => {
            setEditorContent(value ?? '');
            setDirty(true);
          }}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 22,
            wordWrap: 'on',
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            renderLineHighlight: 'none',
          }}
          theme="vs"
        />
      </div>

      {/* Action bar */}
      <div className="px-6 py-3 border-t border-admin-border bg-white flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          icon={<Save size={14} />}
          loading={saveMutation.isPending}
          disabled={!dirty}
          onClick={handleSave}
        >
          Save Draft
        </Button>

        {prompt.status !== 'active' && (
          <Button
            size="sm"
            icon={<Zap size={14} />}
            loading={activateMutation.isPending}
            onClick={handleActivate}
          >
            Activate v{prompt.version}
          </Button>
        )}

        {prompt.status !== 'archived' && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Archive size={14} />}
            loading={archiveMutation.isPending}
            onClick={handleArchive}
          >
            Archive
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          icon={<FlaskConical size={14} />}
          onClick={() => setShowTester(!showTester)}
        >
          {showTester ? 'Hide Tester' : 'Test Prompt'}
        </Button>

        {dirty && (
          <span className="text-xs text-admin-accent-500 ml-auto">Unsaved changes</span>
        )}
      </div>

      {/* Tester panel */}
      {showTester && (
        <div className="px-6 py-4 border-t border-admin-border bg-white overflow-y-auto max-h-96">
          <PromptTester systemPrompt={editorContent} />
        </div>
      )}

      {/* Version history in a sidebar panel */}
      <div className="px-6 pb-4 bg-white max-h-48 overflow-y-auto">
        <VersionHistory
          versions={versions}
          currentId={prompt.id}
          onSelect={(v) => {
            setEditorContent(v.prompt_text);
            setTitle(v.title);
            setDescription(v.description ?? '');
          }}
        />
      </div>
    </div>
  );
}
