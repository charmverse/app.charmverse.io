import type { Schema, Node } from 'prosemirror-model';
import type { EditorState, Transaction } from 'prosemirror-state';
import { CellSelection, mergeCells } from 'prosemirror-tables';
import type { EditorView } from 'prosemirror-view';

import { PARAGRAPH, TABLE_CELL, TEXT } from '../../nodeNames';

import UICommand from './ui/UICommand';

function isBlankParagraphNode(node?: Node): boolean {
  if (!node) {
    return false;
  }
  if (node.type.name !== PARAGRAPH) {
    return false;
  }
  const { firstChild, lastChild } = node;
  if (!firstChild) {
    return true;
  }
  if (firstChild !== lastChild) {
    return false;
  }
  return firstChild.type.name === TEXT && firstChild.text === ' ';
}

function purgeConsecutiveBlankParagraphNodes(tr: Transaction, schema: Schema): Transaction {
  const paragraph = schema.nodes[PARAGRAPH];
  const cell = schema.nodes[TABLE_CELL];
  if (!paragraph || !cell) {
    return tr;
  }
  const { doc, selection } = tr;
  if (!(selection instanceof CellSelection)) {
    return tr;
  }
  const { from, to } = selection;
  const paragraphPoses: number[] = [];
  doc.nodesBetween(from, to, (node, pos, parentNode) => {
    if (node.type === paragraph && parentNode?.type === cell) {
      if (isBlankParagraphNode(node)) {
        const $pos = tr.doc.resolve(pos);
        if (isBlankParagraphNode($pos.nodeBefore || undefined)) {
          paragraphPoses.push(pos);
        }
      }
      return false;
    } else {
      return true;
    }
  });
  paragraphPoses.reverse().forEach((pos) => {
    const _cell = tr.doc.nodeAt(pos);
    if (_cell) {
      tr = tr.delete(pos, pos + _cell.nodeSize);
    }
  });
  return tr;
}

class TableMergeCellsCommand extends UICommand {
  execute = (state: EditorState, dispatch?: ((tr: Transaction) => void) | null, view?: EditorView | null): boolean => {
    const { tr, schema, selection } = state;
    let endTr = tr;
    if (selection instanceof CellSelection) {
      mergeCells(state, (nextTr) => {
        endTr = nextTr;
      });
      // Also merge onsecutive blank paragraphs into one.
      endTr = purgeConsecutiveBlankParagraphNodes(endTr, schema);
    }
    const changed = endTr.docChanged || endTr !== tr;
    if (changed && dispatch) {
      dispatch(endTr);
    }
    return changed;
  };
}

export default TableMergeCellsCommand;
