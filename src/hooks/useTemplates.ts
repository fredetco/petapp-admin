import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllTemplates,
  fetchTemplate,
  createTemplate,
  updateTemplate,
  activateTemplate,
  archiveTemplate,
} from '../services/templates';
import { useAdminAuth } from '../context/AdminAuthContext';
import type { SpeciesCareTemplate } from '../types/template';

export function useAllTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: fetchAllTemplates,
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: () => fetchTemplate(id),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { adminUser } = useAdminAuth();

  return useMutation({
    mutationFn: (params: { species: string; breed?: string; display_name: string; description?: string }) =>
      createTemplate({
        ...params,
        template_tasks: { tasks: [] },
        created_by: adminUser?.id,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SpeciesCareTemplate> }) =>
      updateTemplate(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useActivateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useArchiveTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });
}
