import { useIntl } from 'react-intl';

import type { IPropertyTemplate } from '@packages/databases/board';
import type { Card } from '@packages/databases/card';

import Button from '../../../widgets/buttons/button';
import Calculations from '../../calculations/calculations';

import { KanbanCalculationOptions } from './calculationOptions';

type Props = {
  cards: Card[];
  cardProperties: IPropertyTemplate[];
  menuOpen: boolean;
  onMenuClose: () => void;
  onMenuOpen: (anchorEl: HTMLElement) => void;
  onChange: (data: { calculation: string; propertyId: string }) => void;
  value: string;
  property: IPropertyTemplate;
  readOnly: boolean;
  anchorEl: HTMLElement | null;
};

function KanbanCalculation(props: Props): JSX.Element {
  const intl = useIntl();

  return (
    <div className='KanbanCalculation'>
      <Button
        onClick={(e) => (props.menuOpen ? props.onMenuClose : props.onMenuOpen)(e.currentTarget)}
        title={Calculations[props.value] ? Calculations[props.value](props.cards, props.property, intl) : ''}
      >
        {Calculations[props.value] ? Calculations[props.value](props.cards, props.property, intl) : ''}
      </Button>

      {!props.readOnly && (
        <KanbanCalculationOptions
          value={props.value}
          anchorEl={props.anchorEl}
          property={props.property}
          menuOpen={props.menuOpen}
          onChange={(data: { calculation: string; propertyId: string }) => {
            props.onChange(data);
            props.onMenuClose();
          }}
          onClose={props.onMenuClose}
          cardProperties={props.cardProperties}
        />
      )}
    </div>
  );
}

export { KanbanCalculation };
