import { Autocomplete, TextField } from '@mui/material';
import Alert from '@mui/material/Alert';
import type { Role } from '@prisma/client';
import type { ComponentProps, SyntheticEvent } from 'react';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import UserDisplay from 'components/common/UserDisplay';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import useRoles from 'hooks/useRoles';
import type { Member } from 'lib/members/interfaces';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

type ReducedRole = Role | ListSpaceRolesResponse;

type GroupedRole = ReducedRole & { group: 'role' };
type GroupedMember = Member & { group: 'user' };
type GroupedOption = GroupedRole | GroupedMember;

export function InputSearchReviewers({
  disableCloseOnSelect = false,
  excludedIds,
  ...props
}: Partial<Omit<ComponentProps<typeof Autocomplete>, 'onChange'>> & {
  excludedIds?: string[];
  onChange: (event: SyntheticEvent<Element, Event>, value: GroupedOption[]) => void;
}) {
  const { roles } = useRoles();
  const { members } = useMembers();
  const space = useCurrentSpace();

  const { data: reviewerPool } = useSWR(!space ? null : 'reviewer-pool', () =>
    charmClient.proposals.getReviewerPool(space!.id)
  );

  const excludedIdsSet = new Set(excludedIds);

  const mappedMembers: GroupedMember[] = members.map((member) => ({ ...member, group: 'user' }));
  const mappedRoles: GroupedRole[] =
    roles?.map((includedRole) => ({ ...includedRole, group: 'role' } as ListSpaceRolesResponse & { group: 'role' })) ??
    [];

  const options: GroupedOption[] = [
    ...(reviewerPool?.space ? mappedMembers.filter((member) => !excludedIdsSet.has(member.id)) : []),
    ...mappedRoles.filter(
      (role) => !excludedIdsSet.has(role.id) && (reviewerPool?.space || reviewerPool?.roles.includes(role.id))
    )
  ];

  const optionsRecord: Record<string, GroupedOption> = {};

  [...mappedMembers, ...mappedRoles].forEach((option) => {
    optionsRecord[option.id] = option;
  });

  const noReviewersAvailable = reviewerPool && reviewerPool.space === false && reviewerPool.roles.length === 0;

  return (
    <>
      <Autocomplete<GroupedOption, boolean>
        disabled={!roles || !reviewerPool || !reviewerPool || !noReviewersAvailable}
        loading={!roles || members.length === 0 || !reviewerPool}
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
          No reviewers are available for this proposal. Please ask a space admin to allow the whole space or specific
          roles to review proposals.
        </Alert>
      )}
    </>
  );
}
