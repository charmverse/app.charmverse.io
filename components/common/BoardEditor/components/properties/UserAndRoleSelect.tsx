import type { Role } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton, Box, Stack, Autocomplete, TextField } from '@mui/material';
import Alert from '@mui/material/Alert';
import type { ComponentProps, SyntheticEvent } from 'react';
import { useCallback, useState, useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import UserDisplay from 'components/common/UserDisplay';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useMembers } from 'hooks/useMembers';
import { useRoles } from 'hooks/useRoles';
import type { Member } from 'lib/members/interfaces';
import { isTruthy } from 'lib/utilities/types';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

import { EmptyPlaceholder } from './EmptyPlaceholder';
import { SelectPreviewContainer } from './TagSelect/TagSelect';

type ReducedRole = Role | ListSpaceRolesResponse;

type GroupedRole = ReducedRole & { group: 'role' };
type GroupedMember = Member & { group: 'user' };
type GroupedOption = GroupedRole | GroupedMember;

type ContainerProps = {
  displayType?: PropertyValueDisplayType;
};

const StyledAutocomplete = styled(Autocomplete)`
  min-width: 150px;
` as typeof Autocomplete;

const StyledUserPropertyContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'displayType'
})<ContainerProps>`
  flex-grow: 1;

  ${(props) =>
    props.displayType === 'details'
      ? `
      .MuiInputBase-root {
        padding: 4px 8px;
      }
      `
      : ''}

  // override styles from focalboard
  .MuiInputBase-input {
    background: transparent;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  // dont let the input extend over neighbor columns in table mode when it is expanded
  overflow: ${(props) => (props.displayType === 'table' ? 'hidden' : 'initial')};
`;

function MembersDisplay({
  memberIds,
  readOnly,
  setMemberIds,
  wrapColumn
}: {
  wrapColumn: boolean;
  readOnly: boolean;
  memberIds: string[];
  setMemberIds: (memberIds: string[]) => void;
}) {
  const { membersRecord } = useMembers();

  function removeMember(memberId: string) {
    if (!readOnly) {
      setMemberIds(memberIds.filter((_memberId) => _memberId !== memberId));
    }
  }

  const members = memberIds.map((memberId) => membersRecord[memberId]).filter(isTruthy);

  return memberIds.length === 0 ? null : (
    <Stack flexDirection='row' gap={1} flexWrap={wrapColumn ? 'wrap' : 'nowrap'}>
      {members.map((user) => {
        return (
          <Stack
            alignItems='center'
            flexDirection='row'
            key={user.id}
            gap={0.5}
            sx={wrapColumn ? { justifyContent: 'space-between', overflowX: 'hidden' } : { overflowX: 'hidden' }}
          >
            <UserDisplay fontSize={14} avatarSize='xSmall' user={user} wrapName={wrapColumn} />
            {!readOnly && (
              <IconButton size='small' onClick={() => removeMember(user.id)}>
                <CloseIcon
                  sx={{
                    fontSize: 14
                  }}
                  cursor='pointer'
                  fontSize='small'
                  color='secondary'
                />
              </IconButton>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}

type Props = Partial<Omit<ComponentProps<typeof Autocomplete>, 'onChange'>> & {
  excludedIds?: string[];
  onChange: (event: SyntheticEvent<Element, Event>, value: GroupedOption[]) => void;
  proposalId?: string;
  showEmptyPlaceholder?: boolean;
  displayType?: 'details';
  readOnly?: boolean;
};

export function UserAndRoleSelect({
  readOnly,
  proposalId,
  excludedIds,
  displayType = 'details',
  showEmptyPlaceholder = true,
  ...props
}: Props): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);
  const { roles } = useRoles();
  const { members } = useMembers();
  const { isFreeSpace } = useIsFreeSpace();
  const { data: reviewerPool } = useSWR(proposalId ? 'reviewer-pool' : null, () =>
    charmClient.proposals.getReviewerPool(proposalId as string)
  );

  // For public spaces, we don't want to show reviewer roles
  const applicableValues = isFreeSpace
    ? (props.value as { id: string; group: 'user' | 'role' }[]).filter((elem) => elem.group === 'user')
    : (props.value as { id: string; group: 'user' | 'role' }[]);

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

  const _onChange = useCallback(
    (newMemberIds: string[]) => {
      if (!readOnly) {
        // onChange(newMemberIds);
      }
    },
    [readOnly]
  );

  const onClickToEdit = useCallback(() => {
    if (!readOnly) {
      setIsOpen(true);
    }
  }, [readOnly]);

  if (!isOpen) {
    return (
      <SelectPreviewContainer isHidden={isOpen} displayType={displayType} onClick={onClickToEdit}>
        <Stack gap={0.5}>
          {applicableValues.length === 0 ? (
            showEmptyPlaceholder && <EmptyPlaceholder>Empty</EmptyPlaceholder>
          ) : (
            <MembersDisplay
              wrapColumn={true}
              readOnly={true}
              memberIds={applicableValues.map((v) => v.id)}
              setMemberIds={_onChange}
            />
          )}
        </Stack>
      </SelectPreviewContainer>
    );
  }
  return (
    <StyledUserPropertyContainer displayType='details'>
      <StyledAutocomplete<GroupedOption, boolean>
        disabled={!roles || (proposalId && !reviewerPool) || !noReviewersAvailable}
        loading={!roles || members.length === 0 || (!!proposalId && !reviewerPool)}
        disableCloseOnSelect={false}
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
            placeholder={isFreeSpace ? 'Search for a person...' : 'Search for a person or role...'}
            InputProps={{
              ...params.InputProps,
              disableUnderline: true
            }}
            variant='standard'
          />
        )}
        {...props}
      />
      {noReviewersAvailable && (
        <Alert severity='warning'>
          No reviewers found: an admin must assign specific role(s) or all members as reviewers.
        </Alert>
      )}
    </StyledUserPropertyContainer>
  );
}
