import { useIntl } from 'react-intl';

import type { IPropertyTemplate } from '../../../blocks/board';
import type { Card } from '../../../blocks/card';
import Button from '../../../widgets/buttons/button';
import Calculations from '../../calculations/calculations';

import { KanbanCalculationOptions } from './calculationOptions';

type Props = {
    cards: Card[];
    cardProperties: IPropertyTemplate[];
    menuOpen: boolean;
    onMenuClose: () => void;
    onMenuOpen: () => void;
    onChange: (data: { calculation: string, propertyId: string }) => void;
    value: string;
    property: IPropertyTemplate;
    readOnly: boolean;
}

function KanbanCalculation (props: Props): JSX.Element {
  const intl = useIntl();

  return (
    <div className='KanbanCalculation'>
      <Button
        onClick={() => (props.menuOpen ? props.onMenuClose : props.onMenuOpen)()}
        onBlur={props.onMenuClose}
        title={Calculations[props.value] ? Calculations[props.value](props.cards, props.property, intl) : ''}
      >
        {Calculations[props.value] ? Calculations[props.value](props.cards, props.property, intl) : ''}
      </Button>

      {
                !props.readOnly && props.menuOpen && (
                  <KanbanCalculationOptions
                    value={props.value}
                    property={props.property}
                    menuOpen={props.menuOpen}
                    onChange={(data: { calculation: string, propertyId: string }) => {
                      props.onChange(data);
                      props.onMenuClose();
                    }}
                    cardProperties={props.cardProperties}
                  />
                )
            }
    </div>
  );
}

export {
  KanbanCalculation
};

