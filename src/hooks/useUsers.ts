import { useQuery } from '@tanstack/react-query';
import { fetchAllUsers, fetchUserDetail, fetchPetsForUser } from '../services/users';

export function useAllUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAllUsers,
  });
}

export function useUserDetail(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => fetchUserDetail(userId!),
    enabled: !!userId,
  });
}

export function useUserPets(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin-user-pets', userId],
    queryFn: () => fetchPetsForUser(userId!),
    enabled: !!userId,
  });
}
