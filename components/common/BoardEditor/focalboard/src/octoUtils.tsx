import type { ProposalStatus } from '@charmverse/core/prisma';
import { getChainById } from 'connectors/chains';
import { DateUtils } from 'react-day-picker';

import type { Block } from 'lib/focalboard/block';
import { createBlock } from 'lib/focalboard/block';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { createBoard } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import { createBoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { createCard } from 'lib/focalboard/card';
import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';
import { getAbsolutePath } from 'lib/utilities/browser';
import { isTruthy } from 'lib/utilities/types';

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
  proposalCategories: { [key: string]: string };
  spaceDomain: string;
};

class OctoUtils {
  static propertyDisplayValue({
    block,
    propertyValue,
    propertyTemplate,
    formatters,
    context
  }: {
    block: Block;
    propertyValue: string | string[] | undefined | number;
    propertyTemplate: IPropertyTemplate;
    formatters: Formatters;
    context?: PropertyContext;
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
      case 'proposalCategory': {
        displayValue = typeof propertyValue === 'string' ? context?.proposalCategories[propertyValue] : propertyValue;
        break;
      }
      case 'proposalStatus': {
        const proposalStatus = propertyTemplate.options.find((o) => propertyValue === o.id)?.value;
        displayValue = proposalStatus ? PROPOSAL_STATUS_LABELS[proposalStatus as ProposalStatus] : propertyValue;
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
      case 'rewardApplicantsCount': {
        displayValue = propertyValue === '0' ? '0' : `Applicants ${propertyValue}`;
        break;
      }
      case 'date': {
        if (propertyValue) {
          const singleDate = new Date(parseInt(propertyValue as string, 10));
          if (singleDate && DateUtils.isDate(singleDate)) {
            displayValue = formatDate(new Date(parseInt(propertyValue as string, 10)));
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
