import { useState } from 'react';

import type { Board } from '@packages/databases/board';
import { createBoard } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';
import { Constants } from '@packages/databases/constants';

import mutator from '../../../mutator';
import { filterPropertyTemplates } from '../../../utils/updateVisibilePropertyIds';
import Calculation from '../../calculations/calculation';
import { Options } from '../../calculations/options';
import { columnWidth } from '../tableRow';

import { TableCalculationOptions } from './tableCalculationOptions';

type Props = {
  board: Board;
  cards: Card[];
  activeView: BoardView;
  resizingColumn: string;
  offset: number;
  readOnly: boolean;
};

function CalculationRow(props: Props): JSX.Element {
  const [showOptions, setShowOptions] = useState<Map<string, boolean>>(new Map<string, boolean>());
  const templates = filterPropertyTemplates(
    props.activeView.fields.visiblePropertyIds,
    props.board.fields.cardProperties
  );

  const selectedCalculations = props.board.fields.columnCalculations || [];

  const [hovered, setHovered] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const toggleOptions = (templateId: string, _anchorEl?: HTMLElement) => {
    const newShowOptions = new Map<string, boolean>(showOptions);
    newShowOptions.set(templateId, !!_anchorEl);
    setShowOptions(newShowOptions);
    setAnchorEl(_anchorEl || null);
  };

  return (
    <div
      className='CalculationRow octo-table-row'
      onMouseEnter={() => setHovered(!props.readOnly)}
      onMouseLeave={() => setHovered(false)}
      style={{
        // Checkbox is shown when its not in read only mode. Without margin left there will be misalignment
        marginLeft: props.readOnly ? 0 : 25
      }}
    >
      {templates.map((template) => {
        const style = {
          width: columnWidth(props.resizingColumn, props.activeView.fields.columnWidths, props.offset, template.id)
        };
        const defaultValue = template.id === Constants.titleColumnId ? Options.count.value : Options.none.value;
        const value = selectedCalculations[template.id] || defaultValue;

        return (
          <Calculation
            key={template.id}
            style={style}
            class={`octo-table-cell ${props.readOnly ? 'disabled' : ''}`}
            value={value}
            menuOpen={Boolean(props.readOnly ? false : showOptions.get(template.id) && anchorEl)}
            onMenuClose={() => toggleOptions(template.id)}
            onMenuOpen={(_anchorEl) => toggleOptions(template.id, _anchorEl)}
            onChange={(v: string) => {
              const calculations = { ...selectedCalculations };
              calculations[template.id] = v;
              const newBoard = createBoard({ block: props.board });
              newBoard.fields.columnCalculations = calculations;
              mutator.updateBlock(newBoard, props.board, 'update_calculation');
              setHovered(false);
            }}
            cards={props.cards}
            hovered={hovered}
            optionsComponent={TableCalculationOptions}
            property={template}
            anchorEl={anchorEl}
          />
        );
      })}
    </div>
  );
}

export default CalculationRow;
