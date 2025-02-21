import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import { Autocomplete, Box, Chip, IconButton, Stack, TextField, Tooltip } from '@mui/material';
import { isTruthy } from '@packages/lib/utils/types';
import type { ReactNode } from 'react';
import { Fragment, useCallback, useMemo, useState } from 'react';

import UserDisplay from 'components/common/UserDisplay';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useMembers } from 'hooks/useMembers';
import { useRoles } from 'hooks/useRoles';
import type { Member } from 'lib/members/interfaces';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

import type { PropertyValueDisplayType } from '../../interfaces';

import { EmptyPlaceholder } from './EmptyPlaceholder';
import { PopupFieldWrapper } from './PopupFieldWrapper';
import { SelectPreviewContainer } from './TagSelect/TagSelect';

type RoleOption = { group: 'role'; id: string };
type MemberOption = { group: 'user'; id: string };
type SystemRoleOption<T extends string = string> = { group: 'system_role'; id: T };
export type SelectOption = RoleOption | MemberOption | SystemRoleOption;
type RoleOptionPopulated = ListSpaceRolesResponse & RoleOption;
type MemberOptionPopulated = Member & MemberOption;
export type SystemRoleOptionPopulated<T extends string = string> = SystemRoleOption<T> & {
  icon: JSX.Element;
  label: string;
};

export type SelectOptionPopulated = RoleOptionPopulated | MemberOptionPopulated | SystemRoleOptionPopulated;

type ContainerProps = {
  displayType?: PropertyValueDisplayType;
};

const renderDiv = (props: any & { children: ReactNode }) => <div>{props.children}</div>;

const StyledAutocomplete = styled(Autocomplete<SelectOptionPopulated, true, boolean>)`
  min-width: 150px;
  .MuiAutocomplete-inputRoot {
    gap: 4px;
  }
`;

export const StyledUserPropertyContainer = styled(Box, {
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

export function UserAndRoleSelectedOptions({
  value,
  isRequiredValue = () => false,
  readOnly,
  onRemove,
  wrapColumn,
  errorValues,
  hideIdentity
}: {
  wrapColumn?: boolean;
  readOnly: boolean;
  value: SelectOptionPopulated[];
  isRequiredValue?: (option: SelectOptionPopulated) => boolean;
  onRemove?: (reviewerId: string) => void;
  errorValues?: string[];
  hideIdentity?: boolean;
}) {
  return (
    <>
      {value.map((option) => {
        return (
          <Fragment key={option.id}>
            {option.group === 'user' && (
              <Stack
                mr={1}
                my={0.25}
                alignItems='center'
                flexDirection='row'
                key={option.id}
                data-test='selected-user-or-role-option'
                sx={
                  wrapColumn
                    ? { justifyContent: 'space-between', overflowX: 'hidden' }
                    : { overflowX: 'hidden', minWidth: 'fit-content' }
                }
              >
                <UserDisplay
                  fontSize={14}
                  avatarSize='xSmall'
                  userId={option.id}
                  wrapName={wrapColumn}
                  hideIdentity={hideIdentity}
                />
                {!readOnly && !isRequiredValue(option) && (
                  <IconButton size='small' onClick={() => onRemove?.(option.id)}>
                    <CloseIcon
                      sx={{
                        fontSize: 14
                      }}
                      cursor='pointer'
                      color='secondary'
                    />
                  </IconButton>
                )}
              </Stack>
            )}
            {option.group === 'role' && (
              <Chip
                data-test='selected-user-or-role-option'
                color={errorValues?.includes?.(option.id) ? 'warning' : undefined}
                sx={{ px: 0.5, cursor: readOnly || isRequiredValue(option) ? 'text' : 'pointer', mr: 1 }}
                label={option.name}
                // color={option.color}
                key={option.id}
                size='small'
                onDelete={readOnly || isRequiredValue(option) ? undefined : () => onRemove?.(option.id)}
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
            {option.group === 'system_role' && (
              <Chip
                data-test='selected-user-or-role-option'
                color={errorValues?.includes?.(option.id) ? 'warning' : undefined}
                sx={{ px: 0.5, cursor: readOnly || isRequiredValue(option) ? 'text' : 'pointer', mr: 1 }}
                label={option.label}
                key={option.id}
                icon={option.icon}
                variant='outlined'
                size='small'
                onDelete={readOnly || isRequiredValue(option) ? undefined : () => onRemove?.(option.id)}
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
          </Fragment>
        );
      })}
    </>
  );
}

type Props<T> = {
  emptyPlaceholderContent?: string;
  inputPlaceholder?: string; // placeholder for the editable input of outlined variant
  displayType?: PropertyValueDisplayType;
  onChange: (value: SelectOptionPopulated[]) => void;
  readOnly?: boolean;
  readOnlyMessage?: string;
  showEmptyPlaceholder?: boolean;
  systemRoles?: SystemRoleOptionPopulated[];
  value: (T | string)[];
  options?: { id: string; group: string }[];
  isRequiredValue?: (value: SelectOptionPopulated) => boolean;
  variant?: 'outlined' | 'standard';
  'data-test'?: string;
  wrapColumn?: boolean;
  type?: 'role' | 'roleAndUser';
  required?: boolean;
  errorValues?: string[];
  popupField?: boolean;
  hideIdentity?: boolean;
};

export function UserAndRoleSelect<T extends { id: string; group: string } = SelectOption>({
  displayType = 'details',
  onChange,
  readOnly,
  readOnlyMessage,
  inputPlaceholder,
  showEmptyPlaceholder = true,
  emptyPlaceholderContent = 'Empty',
  systemRoles = [],
  options,
  variant = 'standard',
  value: inputValue,
  isRequiredValue,
  'data-test': dataTest,
  wrapColumn,
  type = 'roleAndUser',
  required,
  errorValues,
  hideIdentity
}: Props<T>): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);
  const { roles } = useRoles();
  const { members, membersRecord } = useMembers();
  const { isFreeSpace } = useIsFreeSpace();

  const selectInputValue: T[] = (inputValue ?? [])
    .map((elem) => {
      if (typeof elem === 'string') {
        const user = membersRecord[elem];
        if (user) {
          return { group: 'user', id: elem } as T;
        }
        const role = roles?.find((r) => r.id === elem);
        if (role) {
          return { group: 'role', id: elem } as T;
        }
        return null;
      }
      return elem;
    })
    .filter(isTruthy);

  const filteredMembers = members.filter((member) => !member.isBot);
  // For public spaces, we don't want to show reviewer roles
  const applicableValues = isFreeSpace ? selectInputValue.filter((elem) => elem.group === 'user') : selectInputValue;

  const mappedMembers: MemberOptionPopulated[] = filteredMembers.map((member) => ({ ...member, group: 'user' }));
  const mappedRoles: RoleOptionPopulated[] =
    roles?.map((includedRole) => ({ ...includedRole, group: 'role' }) as ListSpaceRolesResponse & { group: 'role' }) ??
    [];

  const filteredOptions = useMemo(() => {
    if (options) {
      return options
        .map((option) => {
          if (option.group === 'user') {
            return (
              mappedMembers.find((member) => member.id === option.id) ??
              mappedRoles.find((role) => role.id === option.id)
            );
          } else if (option.group === 'role') {
            return mappedRoles.find((role) => role.id === option.id);
          }
          return null;
        })
        .filter(isTruthy);
    }

    let _filteredOptions: SelectOptionPopulated[] = [];
    if (isFreeSpace) {
      // In public space, don't include custom roles
      _filteredOptions = type === 'role' ? [] : [...mappedMembers, ...systemRoles];
    } else {
      // For bounties, allow any space member or role to be selected
      if (type === 'role') {
        _filteredOptions = [...systemRoles, ...mappedRoles];
      }

      if (type === 'roleAndUser') {
        _filteredOptions = [...mappedMembers, ...systemRoles, ...mappedRoles];
      }
    }
    return _filteredOptions;
  }, [systemRoles, isFreeSpace, filteredMembers, roles, type, options]);

  const allOptions = useMemo(() => {
    if (isFreeSpace) {
      return [...mappedMembers, ...systemRoles];
    } else {
      return [...mappedMembers, ...mappedRoles, ...systemRoles];
    }
  }, [filteredMembers, roles]);

  const populatedValue = selectInputValue.map(({ id }) => allOptions.find((opt) => opt.id === id)).filter(isTruthy);

  const onClickToEdit = useCallback(() => {
    if (!readOnly) {
      setIsOpen(true);
    }
  }, [readOnly]);

  function removeOption(idToRemove: string) {
    onChange(populatedValue.filter(({ id }) => id !== idToRemove));
  }

  function getPlaceholderLabel() {
    if (inputPlaceholder) {
      return inputPlaceholder;
    }
    if (isFreeSpace) {
      return 'Search for a person...';
    }

    if (type === 'role') {
      return 'Search for a role...';
    }

    return 'Search for a person or role...';
  }

  const popupField = displayType === 'table';

  const previewField = (
    <SelectPreviewContainer
      data-test={dataTest}
      isHidden={popupField ? false : isOpen}
      displayType={displayType}
      readOnly={readOnly}
      onClick={onClickToEdit}
    >
      <Tooltip title={readOnlyMessage ?? null}>
        <Box display='inline-flex' flexWrap={wrapColumn ? 'wrap' : 'nowrap'} rowGap={1}>
          {applicableValues.length === 0 ? (
            showEmptyPlaceholder && <EmptyPlaceholder>{emptyPlaceholderContent}</EmptyPlaceholder>
          ) : (
            <UserAndRoleSelectedOptions
              wrapColumn={wrapColumn}
              readOnly
              value={populatedValue}
              onRemove={removeOption}
              errorValues={errorValues}
              hideIdentity={hideIdentity}
            />
          )}
        </Box>
      </Tooltip>
    </SelectPreviewContainer>
  );

  const activeField = (
    <Tooltip title={readOnlyMessage ?? null}>
      <StyledUserPropertyContainer displayType={displayType}>
        <StyledAutocomplete
          PopperComponent={popupField ? renderDiv : undefined}
          PaperComponent={popupField ? renderDiv : undefined}
          data-test={dataTest}
          autoHighlight
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
            if (option.group === 'role') {
              return option.name;
            }
            return option.label;
          }}
          groupBy={(option) => {
            const group = option.group === 'system_role' ? 'role' : option.group;
            return `${group[0].toUpperCase() + group.slice(1)}s`;
          }}
          isOptionEqualToValue={(option, val) => option.id === val.id}
          loading={!roles || filteredMembers.length === 0}
          multiple
          noOptionsText='No more options available'
          onChange={(e, value) => onChange(value)}
          onClose={() => setIsOpen(false)}
          openOnFocus
          options={filteredOptions}
          renderInput={(params) => (
            <TextField
              {...params}
              autoFocus={variant === 'standard'}
              size='small'
              value={applicableValues}
              placeholder={populatedValue.length === 0 ? getPlaceholderLabel() : ''}
              // kind of hacky but useful for proposal forms where its hard to see all required fields
              error={required && populatedValue.length === 0}
              InputProps={{
                ...params.InputProps,
                ...(variant === 'standard' && { disableUnderline: true })
              }}
              variant={variant}
            />
          )}
          renderOption={(_props, option) => {
            if (option.group === 'role') {
              return (
                <li data-test={`select-option-${option.id}`} {..._props}>
                  <Chip sx={{ px: 0.5, cursor: readOnly ? 'text' : 'pointer' }} label={option.name} size='small' />
                </li>
              );
            }
            if (option.group === 'system_role') {
              return (
                <li data-test={`select-option-${option.id}`} {..._props}>
                  <Chip
                    sx={{ px: 0.5, cursor: readOnly ? 'text' : 'pointer' }}
                    variant='outlined'
                    icon={option.icon}
                    label={option.label}
                    size='small'
                  />
                </li>
              );
            }
            return (
              <UserDisplay
                data-test={`select-option-${option.id}`}
                {...(_props as any)}
                userId={option.id}
                avatarSize='small'
                hideIdentity={hideIdentity}
              />
            );
          }}
          renderTags={() => (
            <UserAndRoleSelectedOptions
              wrapColumn={wrapColumn}
              readOnly={!!readOnly}
              value={populatedValue}
              isRequiredValue={isRequiredValue}
              onRemove={removeOption}
              errorValues={errorValues}
            />
          )}
          disabled={!!readOnly}
          value={populatedValue}
        />
      </StyledUserPropertyContainer>
    </Tooltip>
  );

  if (displayType === 'table') {
    return <PopupFieldWrapper disabled={readOnly} previewField={previewField} activeField={activeField} />;
  }

  // TODO: maybe we don't need a separate component for un-open state?
  if (variant === 'standard' && !isOpen) {
    return previewField;
  }

  return activeField;
}
