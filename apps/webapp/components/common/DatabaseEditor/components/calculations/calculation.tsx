import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { CSSProperties } from 'react';
import React from 'react';
import { useIntl } from 'react-intl';

import type { IPropertyTemplate } from '@packages/databases/board';
import type { Card } from '@packages/databases/card';

import Calculations from './calculations';
import type { CommonCalculationOptionProps } from './options';
import { Options, optionDisplayNameString } from './options';

type Props = {
  style: CSSProperties;
  class: string;
  value: string;
  menuOpen: boolean;
  onMenuClose: () => void;
  onMenuOpen: (element: HTMLElement) => void;
  onChange: (value: string) => void;
  cards: readonly Card[];
  property: IPropertyTemplate;
  hovered: boolean;
  // eslint-disable-next-line react/no-unused-prop-types
  optionsComponent: React.ComponentType<CommonCalculationOptionProps>;
  anchorEl: HTMLElement | null;
};

function Calculation(props: Props): JSX.Element {
  const value = props.value || Options.none.value;
  const valueOption = Options[value];
  const intl = useIntl();

  const option = (
    <props.optionsComponent
      value={value}
      menuOpen={props.menuOpen}
      onClose={props.onMenuClose}
      onChange={props.onChange}
      anchorEl={props.anchorEl}
      property={props.property}
    />
  );

  return (
    // tabindex is needed to make onBlur work on div.
    // See this for more details-
    // https://stackoverflow.com/questions/47308081/onblur-event-is-not-firing
    <div
      className={`Calculation ${value} ${props.class} ${props.menuOpen ? 'menuOpen' : ''} ${
        props.hovered ? 'hovered' : ''
      }`}
      style={props.style}
      onClick={(e) => (props.menuOpen ? props.onMenuClose() : props.onMenuOpen(e.currentTarget))}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      // onBlur={props.onMenuClose}
    >
      <div>{option}</div>

      <span className='calculationLabel'>{optionDisplayNameString(valueOption!, intl)}</span>

      {value === Options.none.value && <ExpandMoreIcon fontSize='small' />}

      {value !== Options.none.value && (
        <span className='calculationValue'>
          {Calculations[value] ? Calculations[value](props.cards, props.property, intl) : ''}
        </span>
      )}
    </div>
  );
}

export default Calculation;
