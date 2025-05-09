import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

import type { IPropertyTemplate, PropertyType } from '@packages/databases/board';
import type { Card } from '@packages/databases/card';

import { TextInput } from '../../../properties/TextInput';
import { validatePropertyValue } from '../../../propertyValueElement';

import { PropertyMenu } from './PropertyMenu';

export function RewardCustomValuePropertyTemplateMenu({
  cards,
  propertyTemplate,
  lastChild,
  onChange
}: {
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  lastChild: boolean;
  onChange: (customReward: string) => Promise<void>;
}) {
  const firstCardWithCustomReward = cards.find((card) => card.fields.properties[propertyTemplate.id]);
  const [value, setValue] = useState(
    firstCardWithCustomReward ? (firstCardWithCustomReward.fields.properties[propertyTemplate.id] as string) : ''
  );
  useEffect(() => {
    setValue(
      firstCardWithCustomReward ? (firstCardWithCustomReward.fields.properties[propertyTemplate.id] as string) : ''
    );
  }, [firstCardWithCustomReward, propertyTemplate.id]);

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
              await onChange(value);
              closeMenu();
            }}
            onCancel={() => setValue('')}
            validator={(newValue: string) => validatePropertyValue(propertyTemplate.type, newValue)}
            spellCheck={propertyTemplate.type === 'text'}
          />
        </Box>
      )}
    </PropertyMenu>
  );
}
