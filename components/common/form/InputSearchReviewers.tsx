import { Autocomplete, TextField } from '@mui/material';
import type { Role } from '@prisma/client';
import UserDisplay from 'components/common/UserDisplay';
import { useContributors } from 'hooks/useContributors';
import useRoles from 'hooks/useRoles';
import type { Contributor } from 'models/User';
import type { ListSpaceRolesResponse } from 'pages/api/roles';
import type { ComponentProps, SyntheticEvent } from 'react';

type ReducedRole = Role | ListSpaceRolesResponse

type GroupedRole = ReducedRole & {group: 'role'}
type GroupedContributor = Contributor & {group: 'user'}
type GroupedOption = GroupedRole | GroupedContributor

export default function InputSearchReviewers ({
  disableCloseOnSelect = false, excludedIds, ...props
}: Partial<Omit<ComponentProps<typeof Autocomplete>, 'onChange'>> & { excludedIds?: string[]; onChange: (event: SyntheticEvent<Element, Event>, value: GroupedOption[]) => void }) {
  const { roles } = useRoles();
  const [contributors] = useContributors();

  const excludedIdsSet = new Set(excludedIds);

  const mappedContributors: GroupedContributor[] = contributors.map(contributor => ({ ...contributor, group: 'user' }));
  const mappedRoles: GroupedRole[] = roles?.map(includedRole => ({ ...includedRole, group: 'role' } as const)) ?? [];

  const options: GroupedOption[] = [
    ...mappedContributors.filter(contributor => !excludedIdsSet.has(contributor.id)),
    ...mappedRoles.filter(role => !excludedIdsSet.has(role.id))
  ];

  const optionsRecord: Record<string, GroupedOption> = {};

  [...mappedContributors, ...mappedRoles].forEach(option => {
    optionsRecord[option.id] = option;
  });

  return (
    <Autocomplete<GroupedOption, boolean>
      disabled={!roles}
      loading={!roles || contributors.length === 0}
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
          placeholder='Contributors or Roles'
          inputProps={{
            ...params.inputProps
          }}
        />
      )}
      {...props}
    />
  );
}
