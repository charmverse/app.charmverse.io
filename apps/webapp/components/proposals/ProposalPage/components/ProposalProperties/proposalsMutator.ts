/* eslint-disable default-param-last */
import { Mutator } from 'components/common/DatabaseEditor/mutator';
import { Utils } from 'components/common/DatabaseEditor/utils';
import type { ProposalBlocksContextType } from 'hooks/useProposalBlocks';
import type { UIBlockWithDetails } from '@packages/databases/block';
import type {
  Board,
  IPropertyOption,
  IPropertyTemplate,
  PropertyType,
  RelationPropertyData
} from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';
import type { ProposalBoardBlockFields, ProposalPropertiesField } from '@packages/lib/proposals/blocks/interfaces';

export interface BlockChange {
  block: UIBlockWithDetails;
  newBlock: UIBlockWithDetails;
}

//
// The Mutator is used to make all changes to server state
// It also ensures that the Undo-manager is called for each action
//
export class ProposalsMutator extends Mutator {
  // callback invoked on property value change
  private onPropertiesChange?: (val: any) => void;

  public blocksContext: ProposalBlocksContextType;

  // other methods related to proposal blocks
  constructor(
    blocksContext: ProposalBlocksContextType,
    onPropertiesChange?: (properties: ProposalPropertiesField) => void
  ) {
    super();

    this.blocksContext = blocksContext;
    this.onPropertiesChange = onPropertiesChange;
  }

  // Property Templates
  async insertPropertyTemplate(
    board: Board,
    activeView: BoardView,
    index = -1,
    template?: IPropertyTemplate
  ): Promise<string> {
    const newTemplate = template || {
      id: Utils.createGuid(),
      name: 'New Property',
      type: 'text',
      options: []
    };

    await this.blocksContext.createProperty(newTemplate);

    return newTemplate.id;
  }

  async deleteProperty(board: Board, views: BoardView[], cards: Card[], propertyId: string) {
    await this.blocksContext.deleteProperty(propertyId);
  }

  async changePropertyTypeAndName(
    board: Board,
    cards: Card[],
    propertyTemplate: IPropertyTemplate,
    newType: PropertyType,
    newName: string,
    views: BoardView[],
    relationData?: RelationPropertyData
  ) {
    this.blocksContext.updateProperty({
      ...propertyTemplate,
      type: newType,
      name: newName,
      relationData: newType === 'relation' ? relationData : propertyTemplate.relationData
    });
  }

  // to enable undeleting properties
  async updateProperty(board: Board, propertyId: string, updatedProperty: IPropertyTemplate) {
    this.blocksContext.updateProperty({
      ...updatedProperty
    });
  }

  async reorderProperties(boardId: string, cardProperties: IPropertyTemplate[]): Promise<void> {
    const proposalBoardBlock = this.blocksContext.proposalBoardBlock;
    const oldFields = proposalBoardBlock?.fields || {};

    if (!proposalBoardBlock) {
      return;
    }

    await this.blocksContext.updateBlock({
      ...proposalBoardBlock,
      fields: { ...oldFields, cardProperties } as ProposalBoardBlockFields
    });
  }

  async changePropertyValue(
    card: Card,
    propertyId: string,
    value?: string | string[] | number,
    description = 'change property',
    mutate = true
  ) {
    const oldValue = card.fields.properties[propertyId];

    // dont save anything if property value was not changed.
    if (oldValue === value) {
      return;
    }
    // handle undefined vs empty string
    if (!oldValue && !value) {
      return;
    }

    // proposal fields are saved in Proposal entity so we don't need to update the block
    // that is why we use external onChange callback
    const properties = { ...card.fields.properties } || {};

    if (value) {
      properties[propertyId] = value;
    } else {
      delete properties[propertyId];
    }

    this.onPropertiesChange?.(properties);
  }

  async changePropertyOption(board: Board, template: IPropertyTemplate, updatedOption: IPropertyOption) {
    const proposalBoardBlock = this.blocksContext.proposalBoardBlock;

    const updatedProperties = proposalBoardBlock?.fields?.cardProperties
      ? [...proposalBoardBlock.fields.cardProperties]
      : [];

    if (!proposalBoardBlock) {
      return;
    }

    const properties = updatedProperties.map((p) => {
      if (p.id !== template.id) {
        return p;
      }

      return {
        ...p,
        options: p.options.map((o) =>
          o.id === updatedOption.id ? { ...o, color: updatedOption.color, value: updatedOption.value } : o
        )
      };
    });

    const oldFields = proposalBoardBlock?.fields || {};

    await this.blocksContext.updateBlock({
      ...proposalBoardBlock,
      fields: { ...oldFields, cardProperties: properties } as ProposalBoardBlockFields
    });
  }

  async insertPropertyOption(
    board: Board,
    template: IPropertyTemplate,
    option: IPropertyOption,
    description = 'add option'
  ) {
    const proposalBoardBlock = this.blocksContext.proposalBoardBlock;

    const updatedProperties = proposalBoardBlock?.fields?.cardProperties
      ? [...proposalBoardBlock.fields.cardProperties]
      : [];

    if (!proposalBoardBlock) {
      return;
    }

    const udpatedTemplate = updatedProperties.find((o) => o.id === template.id);

    if (udpatedTemplate) {
      udpatedTemplate.options = udpatedTemplate.options ? [...udpatedTemplate.options, option] : [option];

      const oldFields = proposalBoardBlock?.fields || {};

      await this.blocksContext.updateBlock({
        ...proposalBoardBlock,
        fields: { ...oldFields, cardProperties: updatedProperties } as ProposalBoardBlockFields
      });
    }
  }

  async deletePropertyOption(board: Board, template: IPropertyTemplate, option: IPropertyOption) {
    const proposalBoardBlock = this.blocksContext.proposalBoardBlock;

    const updatedProperties = proposalBoardBlock?.fields?.cardProperties
      ? [...proposalBoardBlock.fields.cardProperties]
      : [];

    if (!proposalBoardBlock) {
      return;
    }

    const udpatedTemplate = updatedProperties.find((o) => o.id === template.id);

    if (udpatedTemplate) {
      udpatedTemplate.options = udpatedTemplate.options?.filter((o) => o.id !== option.id) || [];

      const oldFields = proposalBoardBlock?.fields || {};

      await this.blocksContext.updateBlock({
        ...proposalBoardBlock,
        fields: { ...oldFields, cardProperties: updatedProperties } as ProposalBoardBlockFields
      });
    }
  }
}
