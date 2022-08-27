import React from 'react';

import { CalculationOptions, CommonCalculationOptionProps, optionsByType } from '../../calculations/options';

export function TableCalculationOptions (props: CommonCalculationOptionProps): JSX.Element {
  const options = [...optionsByType.get('common')!];
  if (props.property && optionsByType.get(props.property.type)) {
    options.push(...optionsByType.get(props.property.type)!);
  }

  return (
    <CalculationOptions
      value={props.value}
      menuOpen={props.menuOpen}
      onClose={props.onClose}
      onChange={props.onChange}
      property={props.property}
      options={options}
    />
  );
}
