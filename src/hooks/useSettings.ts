import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllSettings, updateSetting, fetchUserComplexityDistribution } from '../services/settings';
import { useAdminAuth } from '../context/AdminAuthContext';

export function useAllSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchAllSettings,
  });
}

export function useUserDistribution() {
  return useQuery({
    queryKey: ['user-distribution'],
    queryFn: fetchUserComplexityDistribution,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  const { adminUser } = useAdminAuth();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      updateSetting(key, value, adminUser?.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
}
