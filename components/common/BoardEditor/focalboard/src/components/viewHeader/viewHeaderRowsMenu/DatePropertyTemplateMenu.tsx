import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';

import mutator from '../../../mutator';
import DateRange from '../../properties/dateRange/dateRange';

import { PropertyMenu } from './PropertyMenu';

export function DatePropertyTemplateMenu({
  cards,
  propertyTemplate,
  onChange,
  lastChild
}: {
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  onChange?: VoidFunction;
  lastChild: boolean;
}) {
  const propertyValue = cards[0].fields.properties[propertyTemplate.id] || '';
  return (
    <PropertyMenu lastChild={lastChild} cards={cards} propertyTemplate={propertyTemplate}>
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
