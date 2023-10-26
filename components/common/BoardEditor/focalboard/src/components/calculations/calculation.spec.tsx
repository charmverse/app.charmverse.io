import { render } from '@testing-library/react';

import { TestBlockFactory } from '../../test/testBlockFactory';
import { wrapIntl } from '../../testUtils';
import { TableCalculationOptions } from '../table/calculation/tableCalculationOptions';

import Calculation from './calculation';

describe('components/calculations/Calculation', () => {
  const board = TestBlockFactory.createBoard();

  const card = TestBlockFactory.createCard(board);
  card.fields.properties.property_2 = 'Foo';
  card.fields.properties.property_3 = 'Bar';
  card.fields.properties.property_4 = 'Baz';

  const card2 = TestBlockFactory.createCard(board);
  card2.fields.properties.property_2 = 'Lorem';
  card2.fields.properties.property_3 = '';
  card2.fields.properties.property_4 = 'Baz';

  test('should match snapshot - none', () => {
    const component = wrapIntl(
      <Calculation
        style={{}}
        class='fooClass'
        value='none'
        menuOpen={false}
        onMenuClose={() => {}}
        onMenuOpen={() => {}}
        onChange={() => {}}
        cards={[card, card2]}
        anchorEl={null}
        hovered={true}
        property={{
          id: 'property_2',
          name: '',
          type: 'text',
          options: []
        }}
        optionsComponent={TableCalculationOptions}
      />
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('should match snapshot - count', () => {
    const component = wrapIntl(
      <Calculation
        style={{}}
        anchorEl={null}
        class='fooClass'
        value='count'
        menuOpen={false}
        onMenuClose={() => {}}
        onMenuOpen={() => {}}
        onChange={() => {}}
        cards={[card, card2]}
        hovered={true}
        property={{
          id: 'property_2',
          name: '',
          type: 'text',
          options: []
        }}
        optionsComponent={TableCalculationOptions}
      />
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('should match snapshot - countValue', () => {
    const component = wrapIntl(
      <Calculation
        style={{}}
        anchorEl={null}
        class='fooClass'
        value='countValue'
        menuOpen={false}
        onMenuClose={() => {}}
        onMenuOpen={() => {}}
        onChange={() => {}}
        cards={[card, card2]}
        hovered={true}
        property={{
          id: 'property_3',
          name: '',
          type: 'text',
          options: []
        }}
        optionsComponent={TableCalculationOptions}
      />
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('should match snapshot - countUniqueValue', () => {
    const component = wrapIntl(
      <Calculation
        style={{}}
        anchorEl={null}
        class='fooClass'
        value='countUniqueValue'
        menuOpen={false}
        onMenuClose={() => {}}
        onMenuOpen={() => {}}
        onChange={() => {}}
        cards={[card, card2]}
        hovered={true}
        property={{
          id: 'property_4',
          name: '',
          type: 'text',
          options: []
        }}
        optionsComponent={TableCalculationOptions}
      />
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});
