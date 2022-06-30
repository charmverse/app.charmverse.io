import { BoardView } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import { Card } from 'components/common/BoardEditor/focalboard/src/blocks/card';

export interface Column {
  id: string;
  label: string;
}

export interface Row extends Card {
  // id: string;
  // title: string;
  // fields: { [id: string]: string | number | boolean | Date | null };
}

export interface View extends BoardView {
  // id: string;
  // title: string;
  // type: 'board' | 'table';
}
