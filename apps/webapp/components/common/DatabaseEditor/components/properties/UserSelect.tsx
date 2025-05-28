import { log } from '@charmverse/core/log';
import { styled } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { AutocompleteRenderGetTagProps } from '@mui/material';
import { IconButton, Box, Stack, TextField } from '@mui/material';
import { isTruthy } from '@packages/utils/types';
import { useCallback, useState } from 'react';

import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import type { Member } from '@packages/lib/members/interfaces';

import type { PropertyValueDisplayType } from '../../interfaces';

import { EmptyPlaceholder } from './EmptyPlaceholder';
import { ErrorWrapper } from './ErrorWrapper';
import { PopupFieldWrapper } from './PopupFieldWrapper';
import { SelectPreviewContainer } from './TagSelect/TagSelect';

export type UserSelectProps = {
  memberIds: string[];
  readOnly?: boolean;
  onChange: (memberIds: string[]) => void;
  showEmptyPlaceholder?: boolean;
  displayType?: PropertyValueDisplayType;
  wrapColumn?: boolean;
  'data-test'?: string;
  defaultOpened?: boolean;
  error?: string;
  disallowEmpty?: boolean;
};

type ContainerProps = {
  displayType?: PropertyValueDisplayType;
};

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
  members,
  readOnly,
  wrapColumn,
  disallowEmpty,
  getTagProps,
  onDelete
}: {
  disallowEmpty?: boolean;
  wrapColumn: boolean;
  readOnly: boolean;
  members: Member[];
  getTagProps?: AutocompleteRenderGetTagProps;
  onDelete?: (memberId: string) => void; // this prop[ is for components not using Autocomplete
}) {
  const showDeleteIcon = (disallowEmpty && members.length !== 1) || !disallowEmpty;

  const selectedTags = members.map((user, index) => {
    const tagProps = getTagProps?.({ index });
    return (
      <Stack
        mr={1}
        my={0.25}
        alignItems='center'
        flexDirection='row'
        key={user.id}
        gap={0.5}
        sx={
          wrapColumn
            ? { justifyContent: 'space-between', overflowX: 'hidden' }
            : { overflowX: 'hidden', minWidth: 'fit-content' }
        }
      >
        <UserDisplay fontSize={14} avatarSize='xSmall' userId={user.id} wrapName={wrapColumn} />
        {!readOnly && showDeleteIcon && (
          <IconButton size='small' onClick={tagProps ? tagProps.onDelete : () => onDelete!(user.id)}>
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
  });

  if (members.length === 0) {
    return null;
  }

  return wrapColumn ? (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>{selectedTags}</>
  ) : (
    <Stack flexDirection='row' flexWrap='nowrap'>
      {selectedTags}
    </Stack>
  );
}

export function UserSelectWithoutPreview({
  memberIds,
  onChange,
  readOnly,
  defaultOpened,
  error
}: Pick<UserSelectProps, 'memberIds' | 'onChange' | 'readOnly' | 'defaultOpened' | 'error'>) {
  const [isOpen, setIsOpen] = useState(defaultOpened);

  const _onChange = useCallback(
    (newMemberIds: string[]) => {
      if (!readOnly) {
        onChange(newMemberIds);
      }
    },
    [readOnly, onChange]
  );

  return (
    <ErrorWrapper error={error}>
      <StyledUserPropertyContainer>
        <InputSearchMemberMultiple
          disableClearable
          clearOnBlur
          open={isOpen}
          data-test='user-select-without-preview'
          openOnFocus
          disableCloseOnSelect
          defaultValue={memberIds}
          onClose={() => setIsOpen(false)}
          fullWidth
          onChange={_onChange}
          getOptionLabel={(user) => (typeof user === 'string' ? user : user?.username)}
          readOnly={readOnly}
          placeholder={memberIds.length === 0 ? 'Search for a person...' : ''}
          inputVariant='outlined'
          forcePopupIcon={false}
          renderInput={(params) => (
            <TextField
              {...params}
              size='small'
              value={memberIds}
              placeholder={memberIds.length === 0 ? 'Search for a person...' : ''}
              error={!!error}
              InputProps={{
                ...params.InputProps,
                disableUnderline: true
              }}
              variant='outlined'
            />
          )}
          renderTags={(value: Member[], getTagProps) => (
            <MembersDisplay wrapColumn readOnly={!!readOnly} members={value} getTagProps={getTagProps} />
          )}
        />
      </StyledUserPropertyContainer>
    </ErrorWrapper>
  );
}

export function UserSelect({
  displayType = 'details',
  memberIds,
  onChange,
  readOnly,
  showEmptyPlaceholder,
  wrapColumn,
  defaultOpened,
  'data-test': dataTest,
  error,
  disallowEmpty = false
}: UserSelectProps): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(defaultOpened);
  const { membersRecord } = useMembers();

  const members = memberIds.map((id) => membersRecord[id]).filter(isTruthy);
  if (members.length !== memberIds.length) {
    log.warn('Missing profile for some members', { memberIds: memberIds.filter((id) => !membersRecord[id]) });
  }

  const _onChange = useCallback(
    (newMemberIds: string[]) => {
      if (!readOnly && ((disallowEmpty && newMemberIds.length !== 0) || !disallowEmpty)) {
        onChange(newMemberIds);
      } else {
        throw new Error('Cannot change value of read-only user select');
      }
    },
    [readOnly, onChange, disallowEmpty]
  );

  const onClickToEdit = useCallback(() => {
    if (!readOnly) {
      setIsOpen(true);
    }
  }, [readOnly]);

  const previewField = (
    <ErrorWrapper error={error}>
      <SelectPreviewContainer
        data-test={dataTest}
        isHidden={isOpen}
        displayType={displayType}
        readOnly={readOnly}
        onClick={onClickToEdit}
      >
        <Stack gap={0.5}>
          {memberIds.length === 0 ? (
            showEmptyPlaceholder && <EmptyPlaceholder>Empty</EmptyPlaceholder>
          ) : (
            <MembersDisplay
              wrapColumn={displayType === 'details' ? false : (wrapColumn ?? false)}
              readOnly={true}
              members={memberIds.map((id) => membersRecord[id]).filter(isTruthy)}
              onDelete={(memberId) => onChange(memberIds.filter((id) => id !== memberId))}
            />
          )}
        </Stack>
      </SelectPreviewContainer>
    </ErrorWrapper>
  );

  const activeField = (
    <ErrorWrapper error={error}>
      <StyledUserPropertyContainer displayType={displayType}>
        <InputSearchMemberMultiple
          popupField={displayType === 'table'}
          data-test={dataTest}
          disableClearable
          clearOnBlur
          open
          openOnFocus
          disableCloseOnSelect
          defaultValue={memberIds}
          onClose={() => setIsOpen(false)}
          fullWidth
          onChange={_onChange}
          getOptionLabel={(user) => (typeof user === 'string' ? user : user?.username)}
          readOnly={readOnly}
          placeholder={memberIds.length === 0 ? 'Search for a person...' : ''}
          inputVariant='standard'
          forcePopupIcon={false}
          renderTags={(value: Member[], getTagProps) => (
            <MembersDisplay
              disallowEmpty={disallowEmpty}
              wrapColumn={true}
              readOnly={!!readOnly}
              members={value}
              getTagProps={getTagProps}
            />
          )}
        />
      </StyledUserPropertyContainer>
    </ErrorWrapper>
  );

  if (displayType === 'table') {
    return <PopupFieldWrapper disabled={readOnly} previewField={previewField} activeField={activeField} />;
  }

  if (!isOpen) {
    return previewField;
  }

  return activeField;
}
