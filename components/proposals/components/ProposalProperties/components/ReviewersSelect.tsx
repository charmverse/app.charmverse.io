import type { Role } from '@charmverse/core/prisma';
import { Autocomplete, TextField } from '@mui/material';
import Alert from '@mui/material/Alert';
import type { ComponentProps, SyntheticEvent } from 'react';
import { useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import UserDisplay from 'components/common/UserDisplay';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useMembers } from 'hooks/useMembers';
import { useRoles } from 'hooks/useRoles';
import type { Member } from 'lib/members/interfaces';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

type ReducedRole = Role | ListSpaceRolesResponse;

type GroupedRole = ReducedRole & { group: 'role' };
type GroupedMember = Member & { group: 'user' };
type GroupedOption = GroupedRole | GroupedMember;

/**
 * Search across users and roles
 *
 * In public mode, custom roles are hidden
 */
export function ReviewersSelect({
  disableCloseOnSelect = false,
  excludedIds,
  proposalId,
  ...props
}: Partial<Omit<ComponentProps<typeof Autocomplete>, 'onChange'>> & {
  excludedIds?: string[];
  onChange: (event: SyntheticEvent<Element, Event>, value: GroupedOption[]) => void;
  proposalId?: string;
}) {
  const { roles } = useRoles();
  const { members } = useMembers();
  const { isFreeSpace } = useIsFreeSpace();

  const { data: reviewerPool } = useSWR(proposalId ? 'reviewer-pool' : null, () =>
    charmClient.proposals.getReviewerPool(proposalId as string)
  );

  // For public spaces, we don't want to show reviewer roles
  const applicableValues = isFreeSpace
    ? (props.value as { id: string; group: 'user' | 'role' }[]).filter((elem) => elem.group === 'user')
    : props.value;

  const excludedIdsSet = new Set(excludedIds);

  const mappedMembers: GroupedMember[] = members.map((member) => ({ ...member, group: 'user' }));
  const mappedRoles: GroupedRole[] =
    roles?.map((includedRole) => ({ ...includedRole, group: 'role' } as ListSpaceRolesResponse & { group: 'role' })) ??
    [];

  // Avoid mapping through userIds all the time
  const mappedProposalUsers = useMemo(() => {
    return (reviewerPool?.userIds ?? []).reduce((acc, userId) => {
      if (!excludedIdsSet.has(userId)) {
        acc[userId] = userId;
      }
      return acc;
    }, {} as Record<string, string>);
  }, [reviewerPool, excludedIds]);

  let options: GroupedOption[] = [];
  if (proposalId && isFreeSpace) {
    options = reviewerPool ? mappedMembers.filter((member) => !!mappedProposalUsers[member.id]) : [];
  } else if (proposalId && !isFreeSpace) {
    options = [
      // For proposals we only want current space members and roles that are allowed to review proposals
      ...(reviewerPool ? mappedMembers.filter((member) => !!mappedProposalUsers[member.id]) : []),
      ...mappedRoles.filter((role) => reviewerPool?.roleIds.includes(role.id) && !excludedIdsSet.has(role.id))
    ];
  } else if (isFreeSpace) {
    options = [
      // In public space, don't allow custom roles
      ...mappedMembers.filter((member) => !excludedIdsSet.has(member.id))
    ];
  } else {
    options = [
      // For bounties, allow any space member or role to be selected
      ...mappedMembers.filter((member) => !excludedIdsSet.has(member.id)),
      ...mappedRoles.filter((role) => !excludedIdsSet.has(role.id))
    ];
  }

  const optionsRecord: Record<string, GroupedOption> = {};

  [...mappedMembers, ...mappedRoles].forEach((option) => {
    optionsRecord[option.id] = option;
  });

  // Will only happen in the case of proposals
  const noReviewersAvailable =
    proposalId && reviewerPool && reviewerPool.userIds.length === 0 && reviewerPool.roleIds.length === 0;

  return (
    <>
      <Autocomplete<GroupedOption, boolean>
        disabled={!roles || (proposalId && !reviewerPool) || !noReviewersAvailable}
        loading={!roles || members.length === 0 || (!!proposalId && !reviewerPool)}
        disableCloseOnSelect={disableCloseOnSelect}
        noOptionsText='No options available'
        // @ts-ignore - not sure why this fails
        options={options}
        autoHighlight
        groupBy={(option) => option.group[0].toUpperCase() + option.group.slice(1)}
        getOptionLabel={(groupWithId) => {
          if (!groupWithId) {
            return '';
          }

          const option = optionsRecord[groupWithId.id] ?? {};
          if (option.group === 'user') {
            return option.username;
          }
          return option.name ?? '';
        }}
        renderOption={(_props, option) => {
          if (option.group === 'role') {
            return <li {..._props}>{option.name}</li>;
          }
          return <UserDisplay {...(_props as any)} user={option} avatarSize='small' />;
        }}
        multiple
        renderInput={(params) => (
          <TextField
            {...params}
            size='small'
            value={applicableValues}
            placeholder={isFreeSpace ? 'Members' : 'Roles'}
            inputProps={{
              ...params.inputProps
            }}
          />
        )}
        {...props}
      />
      {noReviewersAvailable && (
        <Alert severity='warning'>
          No reviewers found: an admin must assign specific role(s) or all members as reviewers.
        </Alert>
      )}
    </>
  );
}
