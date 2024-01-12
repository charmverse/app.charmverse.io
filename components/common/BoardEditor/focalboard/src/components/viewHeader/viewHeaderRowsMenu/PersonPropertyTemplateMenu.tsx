import type { UserSelectProps } from 'components/common/BoardEditor/components/properties/UserSelect';
import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';

import { PropertyMenu } from './PropertyMenu';

export function PersonPropertyTemplateMenu({
  cards,
  propertyTemplate,
  onChange
}: {
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  onChange: (userIds: string[]) => void;
}) {
  const propertyValue = cards[0].fields.properties[propertyTemplate.id];

  const userSelectProps: UserSelectProps = {
    memberIds: typeof propertyValue === 'string' ? [propertyValue] : (propertyValue as string[]) ?? [],
    onChange,
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
