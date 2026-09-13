import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import type { HouseholdMember, HouseholdMemberInput } from '../api/schema';

export function useHouseholdMembers(enabled: boolean = true) {
  return useQuery<HouseholdMember[], ApiError>({
    queryKey: ['household', 'members'],
    queryFn: () => api.getHouseholdMembers(),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation<HouseholdMember, ApiError, HouseholdMemberInput>({
    mutationFn: (data: HouseholdMemberInput) => api.inviteHouseholdMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', 'members'] });
    },
  });
}
