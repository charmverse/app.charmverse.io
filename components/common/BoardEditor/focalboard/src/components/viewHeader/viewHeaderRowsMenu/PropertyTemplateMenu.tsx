import type { SelectOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { allMembersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';
import { Constants } from 'lib/focalboard/constants';

import mutator from '../../../mutator';

import { DatePropertyTemplateMenu } from './DatePropertyTemplateMenu';
import { PersonPropertyTemplateMenu } from './PersonPropertyTemplateMenu';
import { PropertyMenu, StyledMenuItem } from './PropertyMenu';
import { SelectPropertyTemplateMenu } from './SelectPropertyTemplateMenu';
import { TextPropertyTemplateMenu } from './TextPropertyTemplateMenu';

export function PropertyTemplateMenu({
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
