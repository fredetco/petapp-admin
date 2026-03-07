import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardStats,
  fetchSpeciesDistribution,
  fetchRecentAuditLog,
} from '../services/analytics';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 60_000, // refresh every minute
  });
}

export function useSpeciesDistribution() {
  return useQuery({
    queryKey: ['species-distribution'],
    queryFn: fetchSpeciesDistribution,
  });
}

export function useRecentAuditLog() {
  return useQuery({
    queryKey: ['recent-audit-log'],
    queryFn: fetchRecentAuditLog,
  });
}
