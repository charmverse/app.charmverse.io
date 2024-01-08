import type { TagSelectProps } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';

import mutator from '../../../mutator';

import { PropertyMenu } from './PropertyMenu';

export function SelectPropertyTemplateMenu({
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
