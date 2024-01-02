import { useMemo } from 'react';

import { useGetReviewerPool } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import type { NestedDataTest } from 'testing/e2eType';

import type { SelectOption, UserAndRoleSelectProps } from './UserAndRoleSelect';
import { UserAndRoleSelect } from './UserAndRoleSelect';

type ProposalUserAndRoleSelectProps = Pick<UserAndRoleSelectProps, 'systemRoles' | 'readOnly' | 'value' | 'onChange'>;

export function ProposalUserAndRoleSelect({
  onChange,
  value,
  readOnly,
  systemRoles,
  dataTest
}: ProposalUserAndRoleSelectProps & NestedDataTest) {
  // TODO: Make this component agnostic to 'reviewers' by defining the options outside of it
  const { space } = useCurrentSpace();
  const isFreeSpace = useIsFreeSpace();
  const { data: reviewerPool } = useGetReviewerPool(space?.id);

  const filteredOptions = useMemo(() => {
    if (!reviewerPool) {
      return null;
    }

    const systemRolesToAdd = (systemRoles ?? []).map((r) => ({ group: 'system_role', id: r.id }));

    const userIdsToAdd = reviewerPool.userIds.map((userId) => ({ group: 'user', id: userId }));

    if (isFreeSpace) {
      return [...userIdsToAdd, ...systemRolesToAdd];
    }

    const roleIdsToAdd = reviewerPool.roleIds.map((roleId) => ({ group: 'role', id: roleId }));

    return [...userIdsToAdd, roleIdsToAdd, ...systemRolesToAdd] as SelectOption[];
  }, [reviewerPool, systemRoles, isFreeSpace]);

  return (
    <UserAndRoleSelect
      data-test={dataTest}
      readOnly={readOnly}
      onChange={onChange}
      loading={!filteredOptions}
      value={value}
      options={(filteredOptions as any) ?? []}
    />
  );
}
