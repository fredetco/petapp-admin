import { useQuery } from '@tanstack/react-query';
import { fetchAllPets, fetchPetSpeciesList, type AdminPetFilters } from '../services/admin-pets';

export function useAdminPets(filters: AdminPetFilters) {
  return useQuery({
    queryKey: ['admin-pets', filters],
    queryFn: () => fetchAllPets(filters),
  });
}

export function usePetSpeciesList() {
  return useQuery({
    queryKey: ['admin-pets-species'],
    queryFn: fetchPetSpeciesList,
    staleTime: 5 * 60 * 1000,
  });
}
