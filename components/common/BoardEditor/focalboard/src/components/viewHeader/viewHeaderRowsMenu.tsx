import type { ProposalSystemRole } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Box, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState, useRef, useMemo } from 'react';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import type { TagSelectProps } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { TextInput } from 'components/common/BoardEditor/components/properties/TextInput';
import type { SelectOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import type { UserSelectProps } from 'components/common/BoardEditor/components/properties/UserSelect';
import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';
import { Constants } from 'lib/focalboard/constants';
import type { CreateEventPayload } from 'lib/notifications/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import mutator from '../../mutator';
import DateRange from '../properties/dateRange/dateRange';
import { validatePropertyValue } from '../propertyValueElement';

const StyledStack = styled(Stack)`
  flex-direction: row;
  align-items: center;
  z-index: 1;
  overflow: auto;
  width: 100%;
  margin-right: 8px;

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const StyledMenuItem = styled(MenuItem)`
  border-left: 1px solid ${({ theme }) => theme.palette.divider};
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  padding: ${({ theme }) => theme.spacing(0.5, 1)};
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s ease-in-out;
  color: ${({ theme }) => theme.palette.text.primary};

  &:hover {
    background: ${({ theme }) => theme.palette.action.hover};
    transition: background 0.2s ease-in-out;
  }

  &:first-child {
    border-radius: 4px 0 0 4px;
  }

  &:last-child {
    border-right: 1px solid ${({ theme }) => theme.palette.divider};
    border-radius: 0 4px 4px 0;
  }
`;

function PropertyMenu({
  cards,
  propertyTemplate,
  children
}: {
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  children: (option: { isPropertyOpen: boolean; closeMenu: VoidFunction }) => ReactNode;
}) {
  const popupState = usePopupState({ variant: 'popover' });
  // Without this state, the options menu list is not placed in the correct position
  const [isPropertyOpen, setIsPropertyOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  if (cards.length === 0) {
    return null;
  }

  return (
    <>
      <StyledMenuItem
        ref={ref}
        onClick={() => {
          popupState.open();
          setTimeout(() => {
            setIsPropertyOpen(true);
          }, 150);
        }}
      >
        {propertyTemplate.name}
      </StyledMenuItem>

      <Menu
        anchorEl={ref.current}
        open={popupState.isOpen}
        style={{
          position: 'relative',
          top: -32,
          height: '100%'
        }}
        elevation={1}
        onClose={() => {
          popupState.close();
          setIsPropertyOpen(false);
        }}
      >
        <Box
          sx={{
            padding: '2px 4px'
          }}
        >
          {children({ isPropertyOpen, closeMenu: popupState.close })}
        </Box>
      </Menu>
    </>
  );
}

function SelectPropertyTemplateMenu({
  board,
  cards,
  propertyTemplate,
  onChange
}: {
  board: Board;
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  onChange?: VoidFunction;
}) {
  const propertyValue = cards[0].fields.properties[propertyTemplate.id];

  const tagSelectProps: TagSelectProps = {
    canEditOptions: true,
    multiselect: propertyTemplate.type === 'multiSelect',
    propertyValue: propertyValue as string,
    options: propertyTemplate.options,
    onChange: async (newValue) => {
      await mutator.changePropertyValues(cards, propertyTemplate.id, newValue);
      onChange?.();
    },
    onUpdateOption: (option) => {
      mutator.changePropertyOption(board, propertyTemplate, option);
    },
    onDeleteOption: (option) => {
      mutator.deletePropertyOption(board, propertyTemplate, option);
    },
    onCreateOption: (newValue) => {
      mutator.insertPropertyOption(board, propertyTemplate, newValue, 'add property option');
    },
    displayType: 'table'
  };

  return (
    <PropertyMenu cards={cards} propertyTemplate={propertyTemplate}>
      {({ isPropertyOpen }) =>
        isPropertyOpen ? <TagSelect defaultOpened {...tagSelectProps} /> : <TagSelect {...tagSelectProps} />
      }
    </PropertyMenu>
  );
}

function PersonPropertyTemplateMenu({
  board,
  cards,
  propertyTemplate,
  onChange,
  disallowEmpty
}: {
  disallowEmpty?: boolean;
  board: Board;
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  onChange?: (userIds: string[]) => void;
}) {
  const propertyValue = cards[0].fields.properties[propertyTemplate.id];

  const userSelectProps: UserSelectProps = {
    memberIds: typeof propertyValue === 'string' ? [propertyValue] : (propertyValue as string[]) ?? [],
    onChange: async (newValue) => {
      if (onChange) {
        onChange(newValue);
      } else {
        await mutator.changePropertyValues(cards, propertyTemplate.id, newValue);

        const previousValue = propertyValue
          ? typeof propertyValue === 'string'
            ? [propertyValue]
            : (propertyValue as string[])
          : [];
        const newUserIds = newValue.filter((id) => !previousValue.includes(id));
        charmClient.createEvents({
          spaceId: board.spaceId,
          payload: newUserIds
            .map((userId) =>
              cards.map(
                (card) =>
                  ({
                    cardId: card.id,
                    cardProperty: {
                      id: propertyTemplate.id,
                      name: propertyTemplate.name,
                      value: userId
                    },
                    scope: WebhookEventNames.CardPersonPropertyAssigned
                  } as CreateEventPayload)
              )
            )
            .flat()
        });
      }
    },
    displayType: 'table',
    showEmptyPlaceholder: true,
    disallowEmpty
  };

  return (
    <PropertyMenu cards={cards} propertyTemplate={propertyTemplate}>
      {({ isPropertyOpen }) =>
        isPropertyOpen ? <UserSelect defaultOpened {...userSelectProps} /> : <UserSelect {...userSelectProps} />
      }
    </PropertyMenu>
  );
}

function TextPropertyTemplateMenu({
  cards,
  propertyTemplate,
  onChange
}: {
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  onChange?: VoidFunction;
}) {
  const propertyValue = cards[0].fields.properties[propertyTemplate.id] || '';
  const [value, setValue] = useState(propertyValue);

  return (
    <PropertyMenu cards={cards} propertyTemplate={propertyTemplate}>
      {({ closeMenu }) => {
        return (
          <TextInput
            className='octo-propertyvalue'
            placeholderText='Empty'
            value={value.toString()}
            autoExpand={true}
            onChange={setValue}
            displayType='details'
            onSave={async () => {
              await mutator.changePropertyValues(cards, propertyTemplate.id, value);
              onChange?.();
              closeMenu();
            }}
            onCancel={() => setValue(propertyValue || '')}
            validator={(newValue: string) => validatePropertyValue(propertyTemplate.type, newValue)}
            spellCheck={propertyTemplate.type === 'text'}
          />
        );
      }}
    </PropertyMenu>
  );
}

function DatePropertyTemplateMenu({
  cards,
  propertyTemplate,
  onChange
}: {
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  onChange?: VoidFunction;
}) {
  const propertyValue = cards[0].fields.properties[propertyTemplate.id] || '';
  return (
    <PropertyMenu cards={cards} propertyTemplate={propertyTemplate}>
      {() => {
        return (
          <DateRange
            wrapColumn
            key={propertyValue?.toString()}
            value={propertyValue?.toString()}
            showEmptyPlaceholder
            onChange={async (newValue) => {
              await mutator.changePropertyValues(cards, propertyTemplate.id, newValue);
              onChange?.();
            }}
          />
        );
      }}
    </PropertyMenu>
  );
}

function PropertyTemplateMenu({
  propertyTemplate,
  cards,
  checkedIds,
  board,
  onChange,
  isAdmin,
  onProposalAuthorSelect,
  onProposalReviewerSelect
}: {
  board: Board;
  checkedIds: string[];
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  onChange?: VoidFunction;
  isAdmin: boolean;
  onProposalAuthorSelect: (pageIds: string[], userIds: string[]) => Promise<void>;
  onProposalReviewerSelect: (pageIds: string[], options: SelectOption[]) => Promise<void>;
}) {
  const isValidType = [
    'checkbox',
    'text',
    'number',
    'date',
    'multiSelect',
    'select',
    'url',
    'email',
    'phone',
    'person',
    'proposalAuthor',
    'proposalReviewer'
  ].includes(propertyTemplate.type);

  if (!isValidType || propertyTemplate.id === Constants.titleColumnId) {
    return null;
  }

  const checkedCards = cards.filter((card) => checkedIds.includes(card.id));

  if (checkedCards.length === 0) {
    return null;
  }

  const propertyValue = checkedCards[0].fields.properties[propertyTemplate.id];

  switch (propertyTemplate.type) {
    case 'checkbox': {
      return (
        <StyledMenuItem
          onClick={async () => {
            await mutator.changePropertyValues(
              checkedCards,
              propertyTemplate.id,
              (!(propertyValue === 'true')).toString()
            );
            onChange?.();
          }}
        >
          {propertyTemplate.name}
        </StyledMenuItem>
      );
    }
    case 'select':
    case 'multiSelect': {
      return (
        <SelectPropertyTemplateMenu
          onChange={onChange}
          board={board}
          cards={checkedCards}
          propertyTemplate={propertyTemplate}
        />
      );
    }

    case 'person': {
      return (
        <PersonPropertyTemplateMenu
          onChange={onChange}
          board={board}
          cards={checkedCards}
          propertyTemplate={propertyTemplate}
        />
      );
    }

    case 'proposalAuthor': {
      if (!isAdmin) {
        return null;
      }
      return (
        <PersonPropertyTemplateMenu
          onChange={async (userIds) => {
            await onProposalAuthorSelect(checkedIds, userIds);
            if (onChange) {
              onChange();
            }
          }}
          board={board}
          cards={checkedCards}
          disallowEmpty
          propertyTemplate={propertyTemplate}
        />
      );
    }

    case 'proposalReviewer': {
      if (!isAdmin) {
        return null;
      }

      return (
        <PropertyMenu cards={cards} propertyTemplate={propertyTemplate}>
          {({ isPropertyOpen }) =>
            isPropertyOpen ? (
              <UserAndRoleSelect
                value={propertyValue as any}
                systemRoles={[allMembersSystemRole]}
                onChange={async (options) => {
                  await onProposalReviewerSelect(checkedIds, options);
                  if (onChange) {
                    onChange();
                  }
                }}
                required
              />
            ) : (
              <UserAndRoleSelect
                onChange={() => {}}
                value={propertyValue as any}
                systemRoles={[allMembersSystemRole]}
                readOnly
                required
              />
            )
          }
        </PropertyMenu>
      );
    }

    case 'date': {
      return <DatePropertyTemplateMenu onChange={onChange} cards={checkedCards} propertyTemplate={propertyTemplate} />;
    }

    default: {
      return <TextPropertyTemplateMenu onChange={onChange} cards={checkedCards} propertyTemplate={propertyTemplate} />;
    }
  }
}

export function ViewHeaderRowsMenu({
  cards,
  checkedIds,
  setCheckedIds,
  board,
  propertyTemplates,
  onChange,
  onDelete
}: {
  board: Board;
  cards: Card[];
  setCheckedIds: Dispatch<SetStateAction<string[]>>;
  checkedIds: string[];
  propertyTemplates: IPropertyTemplate<PropertyType>[];
  onChange?: VoidFunction;
  onDelete?: (pageIds: string[]) => Promise<void>;
}) {
  const { pages } = usePages();
  const isAdmin = useIsAdmin();
  const { proposals } = useProposals();
  const [isDeleting, setIsDeleting] = useState(false);
  async function deleteCheckedCards() {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(checkedIds);
      } else {
        await mutator.deleteBlocks(checkedIds, 'delete cards');
      }
    } catch (_) {
      //
    } finally {
      setCheckedIds([]);
      setIsDeleting(false);
    }
  }

  async function updateProposalsAuthor(pageIds: string[], authorIds: string[]) {
    for (const pageId of pageIds) {
      const proposalId = pages[pageId]?.proposalId;
      if (proposalId) {
        try {
          await charmClient.proposals.updateProposal({
            authors: authorIds,
            proposalId
          });
        } catch (err) {
          //
        }
      }
    }
  }

  async function updateProposalsReviewer(pageIds: string[], reviewers: SelectOption[]) {
    let proposalReviewersChanged = false;
    for (const pageId of pageIds) {
      const page = pages[pageId];
      const proposalId = page?.proposalId;
      const proposal = proposalId ? proposals?.find((_proposal) => _proposal.id === proposalId) : null;
      const proposalWithEvaluationId = proposal?.currentEvaluationId;
      if (
        proposal &&
        proposalWithEvaluationId &&
        proposal.status !== 'draft' &&
        proposal.currentEvaluation?.type !== 'feedback' &&
        !page?.sourceTemplateId
      ) {
        await charmClient.proposals.updateProposalEvaluation({
          reviewers: reviewers.map((reviewer) => ({
            roleId: reviewer.group === 'role' ? reviewer.id : null,
            systemRole: reviewer.group === 'system_role' ? (reviewer.id as ProposalSystemRole) : null,
            userId: reviewer.group === 'user' ? reviewer.id : null
          })),
          proposalId: proposal.id,
          evaluationId: proposalWithEvaluationId
        });
        proposalReviewersChanged = true;
      }
    }
    if (proposalReviewersChanged) {
      await mutate(`/api/spaces/${board.spaceId}/proposals`);
    }
  }

  const filteredPropertyTemplates = useMemo(() => {
    return propertyTemplates.filter((propertyTemplate) => !propertyTemplate.formFieldId);
  }, [propertyTemplates]);

  return (
    <StyledStack>
      <StyledMenuItem>
        <Typography onClick={() => setCheckedIds([])} color='primary' variant='body2'>
          {checkedIds.length} selected
        </Typography>
      </StyledMenuItem>
      {cards.length !== 0
        ? filteredPropertyTemplates.map((propertyTemplate) => (
            <PropertyTemplateMenu
              isAdmin={isAdmin}
              board={board}
              checkedIds={checkedIds}
              cards={cards}
              propertyTemplate={propertyTemplate}
              key={propertyTemplate.id}
              onChange={onChange}
              onProposalAuthorSelect={updateProposalsAuthor}
              onProposalReviewerSelect={updateProposalsReviewer}
            />
          ))
        : null}
      <StyledMenuItem onClick={deleteCheckedCards} disabled={isDeleting}>
        <DeleteOutlinedIcon fontSize='small' />
      </StyledMenuItem>
    </StyledStack>
  );
}
