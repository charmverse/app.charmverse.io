import { Autocomplete, TextField } from '@mui/material';
import Alert from '@mui/material/Alert';
import type { Role } from '@prisma/client';
import type { ComponentProps, SyntheticEvent } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import UserDisplay from 'components/common/UserDisplay';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { useRoles } from 'hooks/useRoles';
import type { Member } from 'lib/members/interfaces';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

type ReducedRole = Role | ListSpaceRolesResponse;

type GroupedRole = ReducedRole & { group: 'role' };
type GroupedMember = Member & { group: 'user' };
type GroupedOption = GroupedRole | GroupedMember;

export function InputSearchReviewers({
  disableCloseOnSelect = false,
  excludedIds,
  isProposal,
  ...props
}: Partial<Omit<ComponentProps<typeof Autocomplete>, 'onChange'>> & {
  excludedIds?: string[];
  onChange: (event: SyntheticEvent<Element, Event>, value: GroupedOption[]) => void;
  isProposal?: boolean;
}) {
  const { roles } = useRoles();
  const { members } = useMembers();
  const space = useCurrentSpace();

  const { data: reviewerPool } = useSWR(!space || !isProposal ? null : 'reviewer-pool', () =>
    charmClient.proposals.getReviewerPool(space!.id)
  );

  const excludedIdsSet = new Set(excludedIds);

  const mappedMembers: GroupedMember[] = members.map((member) => ({ ...member, group: 'user' }));
  const mappedRoles: GroupedRole[] =
    roles?.map((includedRole) => ({ ...includedRole, group: 'role' } as ListSpaceRolesResponse & { group: 'role' })) ??
    [];

  const options: GroupedOption[] = isProposal
    ? [
        // For proposals we only want current space members and roles that are allowed to review proposals
        ...(reviewerPool?.space ? mappedMembers.filter((member) => !excludedIdsSet.has(member.id)) : []),
        ...mappedRoles.filter(
          (role) => !excludedIdsSet.has(role.id) && (reviewerPool?.space || reviewerPool?.roles.includes(role.id))
        )
      ]
    : [
        // For bounties, allow any space member or role to be selected
        ...mappedMembers.filter((member) => !excludedIdsSet.has(member.id)),
        ...mappedRoles.filter((role) => !excludedIdsSet.has(role.id))
      ];

  const optionsRecord: Record<string, GroupedOption> = {};

  [...mappedMembers, ...mappedRoles].forEach((option) => {
    optionsRecord[option.id] = option;
  });

  // Will only happen in the case of proposals
  const noReviewersAvailable =
    isProposal && reviewerPool && reviewerPool.space === false && reviewerPool.roles.length === 0;

  return (
    <>
      <Autocomplete<GroupedOption, boolean>
        disabled={!roles || (isProposal && !reviewerPool) || !noReviewersAvailable}
        loading={!roles || members.length === 0 || (isProposal && !reviewerPool)}
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
            placeholder='Members or Roles'
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
