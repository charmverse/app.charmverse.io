import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Chip, IconButton, Box, Stack, Autocomplete, TextField } from '@mui/material';
import type { SyntheticEvent } from 'react';
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

type GroupedRole = { id: string; group: 'role' };
type GroupedMember = { id: string; group: 'user' };
type GroupedOption = GroupedRole | GroupedMember;
type GroupedRolePopulated = ListSpaceRolesResponse & { group: 'role' };
type GroupedMemberPopulated = Member & { group: 'user' };
type GroupedOptionPopulated = GroupedRolePopulated | GroupedMemberPopulated;

type ContainerProps = {
  displayType?: PropertyValueDisplayType;
};

const StyledAutocomplete = styled(Autocomplete<GroupedOptionPopulated, true, boolean>)`
  min-width: 150px;
`;

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

function SelectedReviewers({
  value,
  readOnly,
  onRemove,
  wrapColumn
}: {
  wrapColumn: boolean;
  readOnly: boolean;
  value: GroupedOptionPopulated[];
  onRemove: (reviewerId: string) => void;
}) {
  return (
    <Stack flexDirection='row' gap={1} flexWrap={wrapColumn ? 'wrap' : 'nowrap'}>
      {value.map((reviewer) => {
        return (
          <Stack
            alignItems='center'
            flexDirection='row'
            key={reviewer.id}
            gap={0.5}
            sx={wrapColumn ? { justifyContent: 'space-between', overflowX: 'hidden' } : { overflowX: 'hidden' }}
          >
            {reviewer.group === 'user' && (
              <>
                <UserDisplay fontSize={14} avatarSize='xSmall' user={reviewer} wrapName={wrapColumn} />
                {!readOnly && (
                  <IconButton size='small' onClick={() => onRemove(reviewer.id)}>
                    <CloseIcon
                      sx={{
                        fontSize: 14
                      }}
                      cursor='pointer'
                      color='secondary'
                    />
                  </IconButton>
                )}
              </>
            )}
            {reviewer.group === 'role' && (
              <Chip
                sx={{ px: 0.5, cursor: readOnly ? 'text' : 'pointer' }}
                label={reviewer.name}
                // color={reviewer.color}
                key={reviewer.id}
                size='small'
                onDelete={readOnly ? undefined : () => onRemove(reviewer.id)}
                deleteIcon={
                  <CloseIcon
                    sx={{
                      fontSize: 14
                    }}
                    cursor='pointer'
                  />
                }
              />
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}

type Props = {
  displayType?: 'details';
  onChange: (value: GroupedOptionPopulated[]) => void;
  proposalId?: string;
  readOnly?: boolean;
  showEmptyPlaceholder?: boolean;
  value: GroupedOption[];
};

export function UserAndRoleSelect({
  displayType = 'details',
  onChange,
  proposalId,
  readOnly,
  showEmptyPlaceholder = true,
  value: inputValue
}: Props): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);
  const { roles } = useRoles();
  const { members } = useMembers();
  const { isFreeSpace } = useIsFreeSpace();
  // TODO: Make this component agnostic to 'reviewers' by defining the options outside of it
  const { data: reviewerPool } = useSWR(proposalId ? 'reviewer-pool' : null, () =>
    charmClient.proposals.getReviewerPool(proposalId as string)
  );

  // For public spaces, we don't want to show reviewer roles
  const applicableValues = isFreeSpace
    ? (inputValue as { id: string; group: 'user' | 'role' }[]).filter((elem) => elem.group === 'user')
    : (inputValue as { id: string; group: 'user' | 'role' }[]);

  const mappedMembers: GroupedMemberPopulated[] = members.map((member) => ({ ...member, group: 'user' }));
  const mappedRoles: GroupedRolePopulated[] =
    roles?.map((includedRole) => ({ ...includedRole, group: 'role' } as ListSpaceRolesResponse & { group: 'role' })) ??
    [];

  // Avoid mapping through userIds all the time
  const mappedProposalUsers = useMemo(() => {
    return (reviewerPool?.userIds ?? []).reduce((acc, userId) => {
      acc[userId] = userId;
      return acc;
    }, {} as Record<string, string>);
  }, [reviewerPool]);

  let options: GroupedOptionPopulated[] = [];
  if (proposalId && isFreeSpace) {
    options = reviewerPool ? mappedMembers.filter((member) => !!mappedProposalUsers[member.id]) : [];
  } else if (proposalId && !isFreeSpace) {
    options = [
      // For proposals we only want current space members and roles that are allowed to review proposals
      ...(reviewerPool ? mappedMembers.filter((member) => !!mappedProposalUsers[member.id]) : []),
      ...mappedRoles.filter((role) => reviewerPool?.roleIds.includes(role.id))
    ];
  } else if (isFreeSpace) {
    // In public space, don't include custom roles
    options = [...mappedMembers];
  } else {
    // For bounties, allow any space member or role to be selected
    options = [...mappedMembers, ...mappedRoles];
  }
  // Will only happen in the case of proposals
  const noReviewersAvailable = Boolean(
    proposalId && reviewerPool && reviewerPool.userIds.length === 0 && reviewerPool.roleIds.length === 0
  );
  const populatedValue = inputValue.map(({ id }) => options.find((opt) => opt.id === id)).filter(isTruthy);

  const onClickToEdit = useCallback(() => {
    if (!readOnly) {
      setIsOpen(true);
    }
  }, [readOnly]);

  function removeReviewer(idToRemove: string) {
    onChange(populatedValue.filter(({ id }) => id !== idToRemove));
  }
  if (!isOpen) {
    return (
      <SelectPreviewContainer isHidden={isOpen} displayType={displayType} onClick={onClickToEdit}>
        <Stack gap={0.5}>
          {applicableValues.length === 0 ? (
            showEmptyPlaceholder && <EmptyPlaceholder>Empty</EmptyPlaceholder>
          ) : (
            <SelectedReviewers wrapColumn readOnly value={populatedValue} onRemove={removeReviewer} />
          )}
        </Stack>
      </SelectPreviewContainer>
    );
  }

  return (
    <StyledUserPropertyContainer displayType='details'>
      <StyledAutocomplete
        autoHighlight
        // disabled={!roles || (proposalId && !reviewerPool) || !noReviewersAvailable}
        disableClearable
        disableCloseOnSelect
        filterSelectedOptions
        forcePopupIcon={false}
        fullWidth
        getOptionLabel={(option) => {
          if (!option) {
            return '';
          }
          if (option.group === 'user') {
            return option.username;
          }
          return option.name;
        }}
        groupBy={(option) => `${option.group[0].toUpperCase() + option.group.slice(1)}s`}
        isOptionEqualToValue={(option, val) => option.id === val.id}
        loading={!roles || members.length === 0 || (!!proposalId && !reviewerPool)}
        multiple
        noOptionsText='No more options available'
        onChange={(e, value) => onChange(value)}
        onClose={() => setIsOpen(false)}
        openOnFocus
        options={options}
        renderInput={(params) => (
          <TextField
            {...params}
            autoFocus
            size='small'
            value={applicableValues}
            placeholder={
              populatedValue.length === 0
                ? isFreeSpace
                  ? 'Search for a person...'
                  : 'Search for a person or role...'
                : ''
            }
            InputProps={{
              ...params.InputProps,
              disableUnderline: true
            }}
            variant='standard'
          />
        )}
        renderOption={(_props, option) => {
          if (option.group === 'role') {
            return (
              <li {..._props}>
                <Chip sx={{ px: 0.5, cursor: readOnly ? 'text' : 'pointer' }} label={option.name} size='small' />
              </li>
            );
          }
          return <UserDisplay {...(_props as any)} user={option} avatarSize='small' />;
        }}
        renderTags={() => (
          <SelectedReviewers wrapColumn readOnly={!!readOnly} value={populatedValue} onRemove={removeReviewer} />
        )}
        value={populatedValue}
      />
      {noReviewersAvailable && (
        <Alert severity='warning'>
          No reviewers found: an admin must assign specific role(s) or all members as reviewers.
        </Alert>
      )}
    </StyledUserPropertyContainer>
  );
}
