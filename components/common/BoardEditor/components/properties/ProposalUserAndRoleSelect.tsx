import { useMemo } from 'react';

import { useGetReviewerPool } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import type { NestedDataTest } from 'testing/e2eType';

import type { SelectOption, UserAndRoleSelectProps } from './UserAndRoleSelect';
import { UserAndRoleSelect } from './UserAndRoleSelect';

type ProposalUserAndRoleSelectProps = Pick<
  UserAndRoleSelectProps,
  | 'systemRoles'
  | 'readOnly'
  | 'value'
  | 'onChange'
  | 'data-test'
  | 'variant'
  | 'isRequiredValue'
  | 'wrapColumn'
  | 'inputPlaceholder'
  | 'emptyPlaceholderContent'
  | 'required'
>;

export function ProposalUserAndRoleSelect(props: ProposalUserAndRoleSelectProps) {
  // TODO: Make this component agnostic to 'reviewers' by defining the options outside of it
  const { space } = useCurrentSpace();
  const isFreeSpace = useIsFreeSpace();
  const { data: reviewerPool } = useGetReviewerPool(space?.id);

  const filteredOptions = useMemo(() => {
    if (!reviewerPool) {
      return null;
    }

    const systemRolesToAdd = (props.systemRoles ?? []).map((r) => ({ group: 'system_role', id: r.id }));

    const userIdsToAdd = reviewerPool.userIds.map((userId) => ({ group: 'user', id: userId }));

    if (isFreeSpace) {
      return [...userIdsToAdd, ...systemRolesToAdd];
    }

    const roleIdsToAdd = reviewerPool.roleIds.map((roleId) => ({ group: 'role', id: roleId }));

    return [...userIdsToAdd, roleIdsToAdd, ...systemRolesToAdd] as SelectOption[];
  }, [reviewerPool, props.systemRoles, isFreeSpace]);

  return <UserAndRoleSelect {...props} loading={!filteredOptions} options={filteredOptions as SelectOption[]} />;
}
