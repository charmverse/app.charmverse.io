import { useMemo } from 'react';

import { useMembers } from 'hooks/useMembers';

export function useFilteredMembers(searchQuery: string) {
  const { members } = useMembers();

  const filteredMembers = useMemo(() => {
    const query = searchQuery?.toLowerCase()?.trim();
    if (!query) {
      return members;
    }

    return members.filter((member) => {
      if (member.searchValue?.includes(query)) {
        return true;
      }

      if (member.roles.some((role) => role.name.toLowerCase().includes(query))) {
        return true;
      }

      if (member.roles.some((role) => role.name.toLowerCase().includes(query))) {
        return true;
      }

      if (member.profile?.description?.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });
  }, [searchQuery, members]);

  return filteredMembers;
}
