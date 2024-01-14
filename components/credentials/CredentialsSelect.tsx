import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { useGetCredentialTemplates } from 'components/settings/credentials/hooks/credentialHooks';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { IPropertyOption } from 'lib/focalboard/board';

// import { EmptyPlaceholder } from './EmptyPlaceholder';

type CredentialsSelectProps = {
  onChange: (selectedCredentialId: string) => void;
  selectedCredentialId?: string;
  readOnly?: boolean;
};

export function CredentialSelect({ onChange, selectedCredentialId, readOnly }: CredentialsSelectProps) {
  const { space } = useCurrentSpace();

  const { data: credentialTemplates } = useGetCredentialTemplates({ spaceId: space?.id });

  function _onChange(val: string | string[]) {
    if (Array.isArray(val)) {
      onChange(val[0]);
    } else {
      onChange(val);
    }
  }

  if (!credentialTemplates) {
    return null;
  }

  return (
    <TagSelect
      onChange={_onChange}
      propertyValue={selectedCredentialId as any}
      canEditOptions={false}
      readOnly={readOnly}
      readOnlyMessage='You cannot add a credential'
      noOptionsText='No credentials found'
      options={credentialTemplates?.map(
        (template) => ({ id: template.id, color: 'gray', value: template.name } as IPropertyOption)
      )}
      emptyMessage='+ Add a credential'
    />
  );
}

// export type CredentialSelectProps = {
//   selectedCredentialId: string;
//   readOnly?: boolean;
//   onChange: (selectedCredentialId: string) => void;
//   showEmptyPlaceholder?: boolean;
//   displayType?: PropertyValueDisplayType;
//   wrapColumn?: boolean;
//   'data-test'?: string;
//   defaultOpened?: boolean;
//   error?: string;
//   disallowEmpty?: boolean;
// };

// type ContainerProps = {
//   displayType?: PropertyValueDisplayType;
// };

// const StyledUserPropertyContainer = styled(Box, {
//   shouldForwardProp: (prop) => prop !== 'displayType'
// })<ContainerProps>`
//   flex-grow: 1;

//   ${(props) =>
//     props.displayType === 'details'
//       ? `
//       .MuiInputBase-root {
//         padding: 4px 8px;
//       }
//       `
//       : ''}

//   // override styles from focalboard
//   .MuiInputBase-input {
//     background: transparent;
//     padding-top: 0 !important;
//     padding-bottom: 0 !important;
//   }

//   // dont let the input extend over neighbor columns in table mode when it is expanded
//   overflow: ${(props) => (props.displayType === 'table' ? 'hidden' : 'initial')};
// `;

// function CredentialsDisplay({
//   memberIds,
//   readOnly,
//   setMemberIds,
//   wrapColumn,
//   disallowEmpty
// }: {
//   disallowEmpty?: boolean;
//   wrapColumn: boolean;
//   readOnly: boolean;
//   memberIds: string[];
//   setMemberIds: (memberIds: string[]) => void;
// }) {
//   const { membersRecord } = useMembers();

//   function removeMember(memberId: string) {
//     if (!readOnly) {
//       setMemberIds(memberIds.filter((_memberId) => _memberId !== memberId));
//     }
//   }

//   const members = memberIds.map((memberId) => membersRecord[memberId]).filter(isTruthy);
//   const showDeleteIcon = (disallowEmpty && memberIds.length !== 1) || !disallowEmpty;

//   return memberIds.length === 0 ? null : (
//     <Stack flexDirection='row' gap={1} rowGap={0.5} flexWrap={wrapColumn ? 'wrap' : 'nowrap'}>
//       {members.map((user) => {
//         return (
//           <Stack
//             alignItems='center'
//             flexDirection='row'
//             key={user.id}
//             gap={0.5}
//             sx={wrapColumn ? { justifyContent: 'space-between', overflowX: 'hidden' } : { overflowX: 'hidden' }}
//           >
//             <Box component='span' sx={{ alignItems: 'center', display: 'flex' }}>
//               <MedalIcon />
//               {template.name}
//             </Box>
//             <UserDisplay fontSize={14} avatarSize='xSmall' userId={user.id} wrapName={wrapColumn} />
//             {!readOnly && showDeleteIcon && (
//               <IconButton size='small' onClick={() => removeMember(user.id)}>
//                 <CloseIcon
//                   sx={{
//                     fontSize: 14
//                   }}
//                   cursor='pointer'
//                   fontSize='small'
//                   color='secondary'
//                 />
//               </IconButton>
//             )}
//           </Stack>
//         );
//       })}
//     </Stack>
//   );
// }

// export function CredentialSelect({
//   displayType = 'details',
//   selectedCredentialId,
//   onChange,
//   readOnly,
//   showEmptyPlaceholder,
//   wrapColumn,
//   defaultOpened,
//   'data-test': dataTest,
//   error,
//   disallowEmpty = false
// }: CredentialSelectProps): JSX.Element | null {
//   const [isOpen, setIsOpen] = useState(defaultOpened);

//   const onClickToEdit = useCallback(() => {
//     if (!readOnly) {
//       setIsOpen(true);
//     }
//   }, [readOnly]);

//   if (!isOpen) {
//     return (
//       <ErrorWrapper error={error}>
//         <SelectPreviewContainer
//           data-test={dataTest}
//           isHidden={isOpen}
//           displayType={displayType}
//           readOnly={readOnly}
//           onClick={onClickToEdit}
//         >
//           <Stack gap={0.5}>
//             {!selectedCredentialId ? (
//               showEmptyPlaceholder && <EmptyPlaceholder>Empty</EmptyPlaceholder>
//             ) : (
//               <MembersDisplay
//                 wrapColumn={wrapColumn ?? false}
//                 readOnly={true}
//                 memberIds={memberIds}
//                 setMemberIds={_onChange}
//               />
//             )}
//           </Stack>
//         </SelectPreviewContainer>
//       </ErrorWrapper>
//     );
//   }
//   return (
//     <ErrorWrapper error={error}>
//       <StyledUserPropertyContainer displayType={displayType}>
//         <InputSearchMemberMultiple
//           data-test={dataTest}
//           disableClearable
//           clearOnBlur
//           open
//           openOnFocus
//           disableCloseOnSelect
//           defaultValue={memberIds}
//           onClose={() => setIsOpen(false)}
//           fullWidth
//           onChange={_onChange}
//           getOptionLabel={(user) => (typeof user === 'string' ? user : user?.username)}
//           readOnly={readOnly}
//           placeholder={memberIds.length === 0 ? 'Search for a person...' : ''}
//           inputVariant='standard'
//           forcePopupIcon={false}
//           renderTags={() => (
//             <MembersDisplay
//               disallowEmpty={disallowEmpty}
//               wrapColumn={true}
//               readOnly={!!readOnly}
//               memberIds={memberIds}
//               setMemberIds={_onChange}
//             />
//           )}
//         />
//       </StyledUserPropertyContainer>
//     </ErrorWrapper>
//   );
// }
