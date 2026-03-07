import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllPrompts,
  fetchPromptsByKey,
  createPrompt,
  updatePrompt,
  activatePrompt,
  archivePrompt,
  createAuditEntry,
  fetchAuditLog,
} from '../services/prompts';
import { useAdminAuth } from '../context/AdminAuthContext';

export function useAllPrompts() {
  return useQuery({
    queryKey: ['prompts'],
    queryFn: fetchAllPrompts,
  });
}

export function usePromptsByKey(promptKey: string) {
  return useQuery({
    queryKey: ['prompts', promptKey],
    queryFn: () => fetchPromptsByKey(promptKey),
    enabled: !!promptKey,
  });
}

export function useAuditLog(promptId?: string) {
  return useQuery({
    queryKey: ['audit', promptId],
    queryFn: () => fetchAuditLog(promptId),
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();
  const { adminUser } = useAdminAuth();

  return useMutation({
    mutationFn: async (params: {
      prompt_key: string;
      title: string;
      description?: string;
      prompt_text: string;
      version: number;
    }) => {
      const prompt = await createPrompt({
        ...params,
        status: 'draft',
        created_by: adminUser?.id,
      });
      await createAuditEntry({
        prompt_id: prompt.id,
        action: 'created',
        changed_by: adminUser?.id,
        new_value: params.prompt_text,
      });
      return prompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}

export function useSavePrompt() {
  const queryClient = useQueryClient();
  const { adminUser } = useAdminAuth();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      prompt_text: string;
      old_text: string;
      title?: string;
      description?: string;
    }) => {
      const updates: Record<string, unknown> = { prompt_text: params.prompt_text };
      if (params.title) updates.title = params.title;
      if (params.description !== undefined) updates.description = params.description;

      const prompt = await updatePrompt(params.id, updates);
      await createAuditEntry({
        prompt_id: params.id,
        action: 'edited',
        changed_by: adminUser?.id,
        old_value: params.old_text,
        new_value: params.prompt_text,
      });
      return prompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}

export function useActivatePrompt() {
  const queryClient = useQueryClient();
  const { adminUser } = useAdminAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const prompt = await activatePrompt(id, adminUser?.id);
      await createAuditEntry({
        prompt_id: id,
        action: 'activated',
        changed_by: adminUser?.id,
      });
      return prompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}

export function useArchivePrompt() {
  const queryClient = useQueryClient();
  const { adminUser } = useAdminAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const prompt = await archivePrompt(id);
      await createAuditEntry({
        prompt_id: id,
        action: 'archived',
        changed_by: adminUser?.id,
      });
      return prompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}
