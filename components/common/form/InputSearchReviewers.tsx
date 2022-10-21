import { Autocomplete, TextField } from '@mui/material';
import type { Role } from '@prisma/client';
import type { ComponentProps, SyntheticEvent } from 'react';

import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import useRoles from 'hooks/useRoles';
import type { Member } from 'lib/members/interfaces';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

type ReducedRole = Role | ListSpaceRolesResponse

type GroupedRole = ReducedRole & { group: 'role' }
type GroupedMember = Member & { group: 'user' }
type GroupedOption = GroupedRole | GroupedMember

export default function InputSearchReviewers ({
  disableCloseOnSelect = false, excludedIds, ...props
}: Partial<Omit<ComponentProps<typeof Autocomplete>, 'onChange'>> & { excludedIds?: string[], onChange: (event: SyntheticEvent<Element, Event>, value: GroupedOption[]) => void }) {
  const { roles } = useRoles();
  const { members } = useMembers();

  const excludedIdsSet = new Set(excludedIds);

  const mappedMembers: GroupedMember[] = members.map(member => ({ ...member, group: 'user' }));
  const mappedRoles: GroupedRole[] = roles?.map(includedRole => ({ ...includedRole, group: 'role' } as const)) ?? [];

  const options: GroupedOption[] = [
    ...mappedMembers.filter(member => !excludedIdsSet.has(member.id)),
    ...mappedRoles.filter(role => !excludedIdsSet.has(role.id))
  ];

  const optionsRecord: Record<string, GroupedOption> = {};

  [...mappedMembers, ...mappedRoles].forEach(option => {
    optionsRecord[option.id] = option;
  });

  return (
    <Autocomplete<GroupedOption, boolean>
      disabled={!roles}
      loading={!roles || members.length === 0}
      disableCloseOnSelect={disableCloseOnSelect}
      noOptionsText='No options available'
      // @ts-ignore - not sure why this fails
      options={
      options
      }
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
          return (
            <li {..._props}>
              {option.name}
            </li>
          );
        }
        return (
          <UserDisplay
            {..._props as any}
            user={option}
            avatarSize='small'
          />
        );
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
  );
}
