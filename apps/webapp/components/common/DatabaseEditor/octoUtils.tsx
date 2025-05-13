import type { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import { getChainById } from '@packages/blockchain/connectors/chains';
import { isTruthy } from '@packages/utils/types';
import { DateTime } from 'luxon';

import type { UIBlockWithDetails } from '@packages/databases/block';
import { createBlock } from '@packages/databases/block';
import type { IPropertyTemplate } from '@packages/databases/board';
import { createBoard } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import { createBoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';
import { createCard } from '@packages/databases/card';
import { PROPOSAL_RESULT_LABELS, PROPOSAL_STEP_LABELS } from '@packages/databases/proposalDbProperties';
import type { ProposalEvaluationStep } from '@packages/lib/proposals/interfaces';
import { getAbsolutePath } from '@packages/lib/utils/browser';

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
    cardMap = {}
  }: {
    block: UIBlockWithDetails;
    propertyValue: string | string[] | undefined | number;
    propertyTemplate: IPropertyTemplate;
    formatters: Formatters;
    context?: PropertyContext;
    cardMap?: Record<string, { title: string }>;
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
          if (propertyTemplate.dynamicOptions) {
            displayValue = propertyValue;
          } else {
            const options = propertyTemplate.options.filter((o) => propertyValue.includes(o.id));
            displayValue = options.map((o) => o.value);
          }
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
      case 'proposalPublishedAt': {
        displayValue = propertyValue ? formatDateTime(new Date(propertyValue as string)) : 'N/A';
        break;
      }
      case 'proposalEvaluationDueDate': {
        displayValue = propertyValue ? formatDate(new Date(propertyValue as string)) : 'N/A';
        break;
      }
      case 'person':
      case 'proposalEvaluatedBy':
      case 'proposalAuthor':
      case 'proposalReviewer': {
        const valueArray = Array.isArray(propertyValue)
          ? propertyValue.map((val) => (val as unknown as { userId: string }).userId || val)
          : [propertyValue];
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
        if (Array.isArray(propertyValue)) {
          displayValue = propertyValue.map((pageId) => {
            return cardMap[pageId]?.title || 'Untitled';
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

  static hydrateBlock(block: UIBlockWithDetails): UIBlockWithDetails {
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
      default: {
        Utils.assertFailure(`Can't hydrate unknown block type: ${block.type}`);
        return createBlock(block);
      }
    }
  }

  static hydrateBlocks(blocks: readonly UIBlockWithDetails[]): UIBlockWithDetails[] {
    return blocks.map((block) => this.hydrateBlock(block));
  }

  static mergeBlocks(
    blocks: readonly UIBlockWithDetails[],
    updatedBlocks: readonly UIBlockWithDetails[]
  ): UIBlockWithDetails[] {
    const updatedBlockIds = updatedBlocks.map((o) => o.id);
    const newBlocks = blocks.filter((o) => !updatedBlockIds.includes(o.id));
    const updatedAndNotDeletedBlocks = updatedBlocks.filter((o) => o.deletedAt === 0);
    newBlocks.push(...updatedAndNotDeletedBlocks);
    return newBlocks;
  }

  // Creates a copy of the blocks with new ids and parentIDs
  static duplicateBlockTree(
    blocks: readonly UIBlockWithDetails[],
    sourceBlockId: string
  ): [UIBlockWithDetails[], UIBlockWithDetails, Readonly<Record<string, string>>] {
    const idMap: Record<string, string> = {};
    const now = Date.now();
    const newBlocks = blocks.map((block) => {
      const newBlock = this.hydrateBlock(block);
      newBlock.id = Utils.createGuid();
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
