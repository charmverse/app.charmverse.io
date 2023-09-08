/* eslint-disable default-param-last */
import { Mutator } from 'components/common/BoardEditor/focalboard/src/mutator';
import { IDType, Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import type { ProposalBlocksContextType } from 'hooks/useProposalBlocks';
import type { Block } from 'lib/focalboard/block';
import type { Board, IPropertyOption, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import type { ProposalPropertiesBlockFields, ProposalPropertiesField } from 'lib/proposal/blocks/interfaces';

export interface BlockChange {
  block: Block;
  newBlock: Block;
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
      id: Utils.createGuid(IDType.BlockID),
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
    views: BoardView[]
  ) {
    this.blocksContext.updateProperty({ ...propertyTemplate, type: newType, name: newName });
  }

  async reorderProperties(boardId: string, cardProperties: IPropertyTemplate[]): Promise<void> {
    const proposalPropertiesBlock = this.blocksContext.proposalPropertiesBlock;
    const oldFields = proposalPropertiesBlock?.fields || {};

    if (!proposalPropertiesBlock) {
      return;
    }

    await this.blocksContext.updateBlock({
      ...proposalPropertiesBlock,
      fields: { ...oldFields, cardProperties } as ProposalPropertiesBlockFields
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
    const proposalPropertiesBlock = this.blocksContext.proposalPropertiesBlock;

    const updatedProperties = proposalPropertiesBlock?.fields?.cardProperties
      ? [...proposalPropertiesBlock.fields.cardProperties]
      : [];

    if (!proposalPropertiesBlock) {
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

    const oldFields = proposalPropertiesBlock?.fields || {};

    await this.blocksContext.updateBlock({
      ...proposalPropertiesBlock,
      fields: { ...oldFields, cardProperties: properties } as ProposalPropertiesBlockFields
    });
  }

  async insertPropertyOption(
    board: Board,
    template: IPropertyTemplate,
    option: IPropertyOption,
    description = 'add option'
  ) {
    const proposalPropertiesBlock = this.blocksContext.proposalPropertiesBlock;

    const updatedProperties = proposalPropertiesBlock?.fields?.cardProperties
      ? [...proposalPropertiesBlock.fields.cardProperties]
      : [];

    if (!proposalPropertiesBlock) {
      return;
    }

    const udpatedTemplate = updatedProperties.find((o) => o.id === template.id);

    if (udpatedTemplate) {
      udpatedTemplate.options = udpatedTemplate.options ? [...udpatedTemplate.options, option] : [option];

      const oldFields = proposalPropertiesBlock?.fields || {};

      await this.blocksContext.updateBlock({
        ...proposalPropertiesBlock,
        fields: { ...oldFields, cardProperties: updatedProperties } as ProposalPropertiesBlockFields
      });
    }
  }

  async deletePropertyOption(board: Board, template: IPropertyTemplate, option: IPropertyOption) {
    const proposalPropertiesBlock = this.blocksContext.proposalPropertiesBlock;

    const updatedProperties = proposalPropertiesBlock?.fields?.cardProperties
      ? [...proposalPropertiesBlock.fields.cardProperties]
      : [];

    if (!proposalPropertiesBlock) {
      return;
    }

    const udpatedTemplate = updatedProperties.find((o) => o.id === template.id);

    if (udpatedTemplate) {
      udpatedTemplate.options = udpatedTemplate.options?.filter((o) => o.id !== option.id) || [];

      const oldFields = proposalPropertiesBlock?.fields || {};

      await this.blocksContext.updateBlock({
        ...proposalPropertiesBlock,
        fields: { ...oldFields, cardProperties: updatedProperties } as ProposalPropertiesBlockFields
      });
    }
  }
}
