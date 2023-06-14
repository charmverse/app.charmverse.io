import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';
import { Box, Stack } from '@mui/system';
import { useCallback, useState } from 'react';

import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import { isTruthy } from 'lib/utilities/types';

import { SelectPreviewContainer } from '../SelectProperty/SelectProperty';

type Props = {
  memberIds: string[];
  readOnly: boolean;
  onChange: (memberIds: string[]) => void;
  showEmptyPlaceholder?: boolean;
  displayType?: PropertyValueDisplayType;
  wrapColumn?: boolean;
};

type ContainerProps = {
  displayType?: PropertyValueDisplayType;
};

const StyledUserPropertyContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'displayType'
})<ContainerProps>`
  width: 100%;
  height: 100%;
  overflow: ${({ displayType }) => (displayType === 'table' ? 'hidden' : 'initial')};

  .MuiInputBase-root {
    background-color: ${({ theme }) => theme.palette.background.paper};

    ${({ displayType, theme }) =>
      displayType === 'table'
        ? `
        .MuiAutocomplete-input {
          width: 100%;
          border-top: 1px solid ${theme.palette.divider};
        }`
        : ''}
  }

  .MuiOutlinedInput-root.MuiInputBase-sizeSmall {
    padding: 1px;
  }

  & .MuiInputBase-root,
  & input.MuiInputBase-input {
    /** this overflows to the next line on smaller width */
    position: ${({ displayType }) => (displayType === 'table' ? `inherit` : 'absolute')};
  }

  & .MuiAutocomplete-inputRoot.MuiInputBase-root.MuiOutlinedInput-root {
    padding: 2px;
  }

  & fieldset.MuiOutlinedInput-notchedOutline {
    border: none;
    outline: none;
  }

  & button.MuiButtonBase-root[title='Open'],
  & button.MuiButtonBase-root[title='Close'] {
    display: none;
  }

  & .MuiAutocomplete-tag {
    margin: 2px;
  }
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
    <Stack flexDirection='row' flexWrap={wrapColumn ? 'wrap' : 'nowrap'} gap={1}>
      {members.map((user) => {
        return (
          <Stack
            alignItems='center'
            flexDirection='row'
            key={user.id}
            gap={0.5}
            sx={
              wrapColumn
                ? { width: '100%', justifyContent: 'space-between', overflowX: 'hidden' }
                : { overflowX: 'hidden' }
            }
            onClick={() => removeMember(user.id)}
          >
            <UserDisplay fontSize={14} avatarSize='xSmall' user={user} wrapName={wrapColumn} />
            {!readOnly && (
              <IconButton size='small'>
                <CloseIcon
                  sx={{
                    fontSize: 14
                  }}
                  cursor='pointer'
                  fontSize='small'
                  color='secondary'
                  onClick={() => removeMember(user.id)}
                />
              </IconButton>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}

export function UserProperty({
  displayType,
  memberIds,
  onChange,
  readOnly,
  showEmptyPlaceholder,
  wrapColumn
}: Props): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);

  const _onChange = useCallback(
    (newMemberIds: string[]) => {
      if (!readOnly) {
        onChange(newMemberIds);
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
      <SelectPreviewContainer displayType={displayType} onClick={onClickToEdit}>
        {displayType === 'details' && memberIds.length === 0 ? (
          <div
            className='octo-propertyvalue'
            style={{
              color: 'var(--text-gray)'
            }}
          >
            Empty
          </div>
        ) : (
          <MembersDisplay
            wrapColumn={wrapColumn ?? false}
            readOnly={true}
            memberIds={memberIds}
            setMemberIds={_onChange}
          />
        )}
      </SelectPreviewContainer>
    );
  }
  return (
    <StyledUserPropertyContainer displayType={displayType}>
      <InputSearchMemberMultiple
        // sx={{ '& .MuiAutocomplete-paper': { margin: 0, marginTop: '-20px' } }}
        disableClearable
        open={true}
        openOnFocus
        disableCloseOnSelect
        defaultValue={memberIds}
        onClose={() => setIsOpen(false)}
        onChange={_onChange}
        getOptionLabel={(user) => (typeof user === 'string' ? user : user?.username)}
        readOnly={readOnly}
        placeholder={showEmptyPlaceholder && memberIds.length === 0 ? 'Empty' : ''}
        renderTags={() => (
          <MembersDisplay wrapColumn={true} readOnly={readOnly} memberIds={memberIds} setMemberIds={_onChange} />
        )}
      />
    </StyledUserPropertyContainer>
  );
}
