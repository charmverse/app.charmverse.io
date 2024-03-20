import type { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import { getChainById } from 'connectors/chains';
import { DateTime } from 'luxon';

import type { Block } from 'lib/databases/block';
import { createBlock } from 'lib/databases/block';
import type { IPropertyTemplate } from 'lib/databases/board';
import { createBoard } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import { createBoardView } from 'lib/databases/boardView';
import type { Card } from 'lib/databases/card';
import { createCard } from 'lib/databases/card';
import { PROPOSAL_RESULT_LABELS, PROPOSAL_STEP_LABELS } from 'lib/databases/proposalDbProperties';
import type { ProposalEvaluationStep } from 'lib/proposals/interfaces';
import { getAbsolutePath } from 'lib/utils/browser';
import { isTruthy } from 'lib/utils/types';

import type { PageListItemsRecord } from '../../interfaces';

import { createCheckboxBlock } from './blocks/checkboxBlock';
import { createImageBlock } from './blocks/imageBlock';
import { createTextBlock } from './blocks/textBlock';
import { Utils } from './utils';

export type Formatters = {
  date(date: Date | string): string;
  dateTime(date: Date | string): string;
};

export type PropertyContext = {
  users: { [key: string]: { username: string } };
  spaceDomain: string;
};

class OctoUtils {
  static propertyDisplayValue({
    block,
    propertyValue,
    propertyTemplate,
    formatters,
    context,
    relationPropertiesCardsRecord = {}
  }: {
    block: Block;
    propertyValue: string | string[] | undefined | number;
    propertyTemplate: IPropertyTemplate;
    formatters: Formatters;
    context?: PropertyContext;
    relationPropertiesCardsRecord?: PageListItemsRecord;
  }) {
    const { date: formatDate, dateTime: formatDateTime } = formatters;
    let displayValue: string | string[] | undefined | number;
    switch (propertyTemplate.type) {
      case 'select': {
        // The property value is the id of the template
        if (propertyValue) {
          const option = propertyTemplate.options.find((o) => o.id === propertyValue);
          displayValue = option?.value || '(Unknown)';
        }
        break;
      }
      case 'multiSelect': {
        if (Array.isArray(propertyValue)) {
          const options = propertyTemplate.options.filter((o) => propertyValue.includes(o.id));
          displayValue = options.map((o) => o.value);
        }
        break;
      }
      case 'proposalStatus': {
        displayValue = propertyValue
          ? PROPOSAL_RESULT_LABELS[propertyValue as ProposalEvaluationResult]
          : 'In Progress';
        break;
      }
      case 'proposalStep': {
        displayValue = propertyValue;
        break;
      }
      case 'proposalEvaluationType': {
        displayValue = PROPOSAL_STEP_LABELS[propertyValue as ProposalEvaluationStep];
        break;
      }
      case 'person':
      case 'proposalEvaluatedBy':
      case 'proposalAuthor':
      case 'proposalReviewer': {
        const valueArray = Array.isArray(propertyValue) ? propertyValue : [propertyValue];
        displayValue = valueArray
          .map((value) => (typeof value === 'string' ? context?.users[value]?.username : null))
          .filter(isTruthy);
        break;
      }
      case 'proposalUrl': {
        displayValue =
          typeof propertyValue === 'string' ? getAbsolutePath(`/${propertyValue}`, context?.spaceDomain) : '';
        break;
      }
      case 'relation': {
        const pageListItems = relationPropertiesCardsRecord[propertyTemplate.id];
        if (pageListItems && Array.isArray(propertyValue)) {
          displayValue = propertyValue.map((pageListItemId) => {
            const pageListItem = pageListItems.find((item) => item.id === pageListItemId);
            return pageListItem?.title || 'Untitled';
          });
        }
        break;
      }
      case 'createdTime': {
        displayValue = formatDateTime(new Date(block.createdAt));
        break;
      }
      case 'updatedTime': {
        displayValue = formatDateTime(new Date(block.updatedAt));
        break;
      }
      case 'tokenChain': {
        const chain = typeof propertyValue === 'number' ? getChainById(propertyValue) : null;
        displayValue = chain ? chain.chainName : '';
        break;
      }
      case 'date': {
        if (propertyValue) {
          const singleDate = new Date(parseInt(propertyValue as string, 10));
          if (singleDate && DateTime.fromJSDate(singleDate).isValid) {
            displayValue = formatDate(singleDate);
          } else {
            try {
              const dateValue = JSON.parse(propertyValue as string);
              if (dateValue.from) {
                displayValue = formatDate(new Date(dateValue.from));
              }
              if (dateValue.to) {
                displayValue += ' -> ';
                displayValue += formatDate(new Date(dateValue.to));
              }
            } catch {
              // do nothing
            }
          }
        }
        break;
      }
      default:
        displayValue = propertyValue;
    }

    return displayValue;
  }

  static hydrateBlock(block: Block): Block {
    switch (block.type) {
      case 'board': {
        return createBoard({ block });
      }
      case 'view': {
        return createBoardView(block);
      }
      case 'card': {
        return createCard(block);
      }
      case 'text': {
        return createTextBlock(block);
      }
      case 'image': {
        return createImageBlock(block);
      }
      case 'checkbox': {
        return createCheckboxBlock(block);
      }
      default: {
        Utils.assertFailure(`Can't hydrate unknown block type: ${block.type}`);
        return createBlock(block);
      }
    }
  }

  static hydrateBlocks(blocks: readonly Block[]): Block[] {
    return blocks.map((block) => this.hydrateBlock(block));
  }

  static mergeBlocks(blocks: readonly Block[], updatedBlocks: readonly Block[]): Block[] {
    const updatedBlockIds = updatedBlocks.map((o) => o.id);
    const newBlocks = blocks.filter((o) => !updatedBlockIds.includes(o.id));
    const updatedAndNotDeletedBlocks = updatedBlocks.filter((o) => o.deletedAt === 0);
    newBlocks.push(...updatedAndNotDeletedBlocks);
    return newBlocks;
  }

  // Creates a copy of the blocks with new ids and parentIDs
  static duplicateBlockTree(
    blocks: readonly Block[],
    sourceBlockId: string
  ): [Block[], Block, Readonly<Record<string, string>>] {
    const idMap: Record<string, string> = {};
    const now = Date.now();
    const newBlocks = blocks.map((block) => {
      const newBlock = this.hydrateBlock(block);
      newBlock.id = Utils.createGuid(Utils.blockTypeToIDType(newBlock.type));
      newBlock.createdAt = now;
      newBlock.updatedAt = now;
      idMap[block.id] = newBlock.id;
      return newBlock;
    });

    const newSourceBlockId = idMap[sourceBlockId];

    // Determine the new rootId if needed
    let newRootId: string;
    const sourceBlock = blocks.find((block) => block.id === sourceBlockId)!;
    if (sourceBlock.rootId === sourceBlock.id) {
      // Special case: when duplicating a tree from root, remap all the descendant rootIds
      const newSourceRootBlock = newBlocks.find((block) => block.id === newSourceBlockId)!;
      newRootId = newSourceRootBlock.id;
    }

    newBlocks.forEach((newBlock) => {
      // Note: Don't remap the parent of the new root block
      if (newBlock.id !== newSourceBlockId && newBlock.parentId) {
        newBlock.parentId = idMap[newBlock.parentId] || newBlock.parentId;
        Utils.assert(newBlock.parentId, `Block ${newBlock.id} (${newBlock.type} ${newBlock.title}) has no parent`);
      }

      // Remap the rootIds if we are duplicating a tree from root
      if (newRootId) {
        newBlock.rootId = newRootId;
      }

      // Remap manual card order
      if (newBlock.type === 'view') {
        const view = newBlock as BoardView;
        view.fields.cardOrder = view.fields.cardOrder.map((o) => idMap[o]);
      }

      // Remap card content order
      if (newBlock.type === 'card') {
        const card = newBlock as Card;
        card.fields.contentOrder = card.fields.contentOrder.map((o) =>
          Array.isArray(o) ? o.map((o2) => idMap[o2]) : idMap[o]
        );
      }
    });

    const newSourceBlock = newBlocks.find((block) => block.id === newSourceBlockId)!;
    return [newBlocks, newSourceBlock, idMap];
  }
}

export { OctoUtils };
