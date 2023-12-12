import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton, Box, Stack } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import { ErrorWrapper } from 'components/common/BoardEditor/components/properties/ErrorWrapper';
import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import { isTruthy } from 'lib/utilities/types';

import { EmptyPlaceholder } from './EmptyPlaceholder';
import { SelectPreviewContainer } from './TagSelect/TagSelect';

type Props = {
  memberIds: string[];
  readOnly?: boolean;
  onChange: (memberIds: string[]) => void;
  showEmptyPlaceholder?: boolean;
  displayType?: PropertyValueDisplayType;
  wrapColumn?: boolean;
  'data-test'?: string;
  open?: boolean;
  error?: string;
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
    <Stack flexDirection='row' gap={1} rowGap={0.5} flexWrap={wrapColumn ? 'wrap' : 'nowrap'}>
      {members.map((user) => {
        return (
          <Stack
            alignItems='center'
            flexDirection='row'
            key={user.id}
            gap={0.5}
            sx={wrapColumn ? { justifyContent: 'space-between', overflowX: 'hidden' } : { overflowX: 'hidden' }}
          >
            <UserDisplay fontSize={14} avatarSize='xSmall' userId={user.id} wrapName={wrapColumn} />
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

export function UserSelect({
  displayType = 'details',
  memberIds,
  onChange,
  readOnly,
  showEmptyPlaceholder,
  wrapColumn,
  open,
  'data-test': dataTest,
  error
}: Props): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const _onChange = useCallback(
    (newMemberIds: string[]) => {
      if (!readOnly) {
        onChange(newMemberIds);
      }
    },
    [readOnly, onChange]
  );

  const onClickToEdit = useCallback(() => {
    if (!readOnly) {
      setIsOpen(true);
    }
  }, [readOnly]);

  if (!isOpen) {
    return (
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
                wrapColumn={wrapColumn ?? false}
                readOnly={true}
                memberIds={memberIds}
                setMemberIds={_onChange}
              />
            )}
          </Stack>
        </SelectPreviewContainer>
      </ErrorWrapper>
    );
  }
  return (
    <ErrorWrapper error={error}>
      <StyledUserPropertyContainer displayType={displayType}>
        <InputSearchMemberMultiple
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
          renderTags={() => (
            <MembersDisplay wrapColumn={true} readOnly={!!readOnly} memberIds={memberIds} setMemberIds={_onChange} />
          )}
        />
      </StyledUserPropertyContainer>
    </ErrorWrapper>
  );
}
