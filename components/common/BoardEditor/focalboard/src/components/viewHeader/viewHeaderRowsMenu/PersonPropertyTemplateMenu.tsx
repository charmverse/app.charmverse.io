import charmClient from 'charmClient';
import type { UserSelectProps } from 'components/common/BoardEditor/components/properties/UserSelect';
import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';
import type { CreateEventPayload } from 'lib/notifications/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import mutator from '../../../mutator';

import { PropertyMenu } from './PropertyMenu';

export function PersonPropertyTemplateMenu({
  board,
  cards,
  propertyTemplate,
  onChange
}: {
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
    showEmptyPlaceholder: true
  };

  return (
    <PropertyMenu cards={cards} propertyTemplate={propertyTemplate}>
      {({ isPropertyOpen }) =>
        isPropertyOpen ? <UserSelect defaultOpened {...userSelectProps} /> : <UserSelect {...userSelectProps} />
      }
    </PropertyMenu>
  );
}
