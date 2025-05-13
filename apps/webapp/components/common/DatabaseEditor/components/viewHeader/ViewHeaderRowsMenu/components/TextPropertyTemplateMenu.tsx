import { Box } from '@mui/material';
import { useState } from 'react';

import type { IPropertyTemplate, PropertyType } from '@packages/databases/board';
import type { Card } from '@packages/databases/card';

import mutator from '../../../../mutator';
import { TextInput } from '../../../properties/TextInput';
import { validatePropertyValue } from '../../../propertyValueElement';

import { PropertyMenu } from './PropertyMenu';

export function TextPropertyTemplateMenu({
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
  const [value, setValue] = useState(propertyValue);

  return (
    <PropertyMenu lastChild={lastChild} propertyTemplate={propertyTemplate}>
      {({ closeMenu }) => (
        <Box display='flex' py='2px' px='4px'>
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
        </Box>
      )}
    </PropertyMenu>
  );
}
