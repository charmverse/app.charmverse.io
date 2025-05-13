import { Box } from '@mui/material';

import type { IPropertyTemplate, PropertyType } from '@packages/databases/board';
import type { Card } from '@packages/databases/card';

import mutator from '../../../../mutator';
import DateRange from '../../../properties/dateRange/dateRange';

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
    <PropertyMenu lastChild={lastChild} propertyTemplate={propertyTemplate}>
      {() => {
        return (
          <Box display='flex' py='2px' px='4px'>
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
          </Box>
        );
      }}
    </PropertyMenu>
  );
}
