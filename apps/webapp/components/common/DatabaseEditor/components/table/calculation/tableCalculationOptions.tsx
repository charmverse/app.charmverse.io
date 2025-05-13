import React from 'react';

import type { CommonCalculationOptionProps } from '../../calculations/options';
import { CalculationOptions, optionsByType } from '../../calculations/options';

export function TableCalculationOptions(
  props: CommonCalculationOptionProps & { property?: { type: string } }
): JSX.Element {
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
      anchorEl={props.anchorEl}
      options={options}
    />
  );
}
