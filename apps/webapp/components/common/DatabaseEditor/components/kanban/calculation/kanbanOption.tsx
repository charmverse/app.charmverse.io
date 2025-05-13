import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box } from '@mui/material';
import { useState } from 'react';

import type { IPropertyTemplate } from '@packages/databases/board';
import { Constants } from '@packages/databases/constants';

import type { Option as SelectOption } from '../../calculations/options';
import { typesByOptions } from '../../calculations/options';

type OptionProps = SelectOption & {
  cardProperties: IPropertyTemplate[];
  onChange: (data: { calculation: string; propertyId: string }) => void;
  activeValue: string;
  activeProperty: IPropertyTemplate;
};

function Option(props: { data: OptionProps }): JSX.Element {
  const [submenu, setSubmenu] = useState(false);
  const [height, setHeight] = useState(0);
  const [menuOptionRight, setMenuOptionRight] = useState(0);
  const [calculationToProperties, setCalculationToProperties] = useState<Map<string, IPropertyTemplate[]>>(new Map());

  const toggleOption = (e: any) => {
    if (submenu) {
      setSubmenu(false);
    } else {
      const rect = e.target.getBoundingClientRect();
      setHeight(rect.y);
      setMenuOptionRight(rect.x + rect.width);
      setSubmenu(true);
    }
  };

  if (!calculationToProperties.get(props.data.value)) {
    const supportedPropertyTypes = new Map<string, boolean>([]);
    if (typesByOptions.get(props.data.value)) {
      (typesByOptions.get(props.data.value) || []).forEach((propertyType) =>
        supportedPropertyTypes.set(propertyType, true)
      );
    }

    const supportedProperties = props.data.cardProperties.filter(
      (property) => supportedPropertyTypes.get(property.type) || supportedPropertyTypes.get('common')
    );

    calculationToProperties.set(props.data.value, supportedProperties);
    setCalculationToProperties(calculationToProperties);
  }

  return (
    <div
      className={`KanbanCalculationOptions_CustomOption ${props.data.activeValue === props.data.value ? 'active' : ''}`}
      onMouseEnter={toggleOption}
      onMouseLeave={toggleOption}
      onClick={() => {
        if (props.data.value !== 'count') {
          return;
        }

        props.data.onChange({
          calculation: 'count',
          propertyId: Constants.titleColumnId
        });
      }}
    >
      <Box display='flex' alignItems='center'>
        {props.data.label} {props.data.value !== 'count' && <ChevronRightIcon fontSize='small' />}
      </Box>

      {submenu && props.data.value !== 'count' && (
        <div className='dropdown-submenu' style={{ top: `${height - 10}px`, left: `${menuOptionRight}px` }}>
          {calculationToProperties.get(props.data.value) &&
            calculationToProperties.get(props.data.value)!.map((property) => (
              <div
                key={property.id}
                className={`drops ${props.data.activeProperty.id === property.id ? 'active' : ''}`}
                onClick={() => {
                  props.data.onChange({
                    calculation: props.data.value,
                    propertyId: property.id
                  });
                }}
              >
                <span>{property.name}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export { Option };
export type { OptionProps };
