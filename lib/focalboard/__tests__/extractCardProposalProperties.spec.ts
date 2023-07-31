import { ProposalStatus } from '@charmverse/core/prisma-client';
import { objectUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { IPropertyTemplate } from 'lib/focalboard/board';

import type { ExtractedCardProposalProperties } from '../extractCardProposalProperties';
import { extractCardProposalProperties } from '../extractCardProposalProperties';
import { extractDatabaseProposalProperties } from '../extractDatabaseProposalProperties';

const categoryProp: IPropertyTemplate = {
  id: uuid(),
  name: 'Proposal Category',
  type: 'proposalCategory',
  options: [
    {
      id: uuid(),
      color: 'propColorTeal',
      value: 'General'
    },
    {
      id: uuid(),
      color: 'propColorTeal',
      value: 'Admin-only'
    }
  ]
};

const statusProp: IPropertyTemplate = {
  id: uuid(),
  name: 'Proposal Status',
  type: 'proposalStatus',
  options: [
    ...objectUtils.typedKeys(ProposalStatus).map((key) => ({
      id: uuid(),
      color: 'propColorTeal',
      value: key
    })),
    {
      id: uuid(),
      color: 'propColorTeal',
      value: 'archived'
    }
  ]
};

const urlProp: IPropertyTemplate = {
  id: uuid(),
  name: 'Proposal URL',
  type: 'proposalUrl',
  options: []
};

describe('extractCardProposalProperties', () => {
  it('should extract card proposal properties', () => {
    const exampleProperties: IPropertyTemplate[] = [categoryProp, statusProp, urlProp];

    const extractedSchema = extractDatabaseProposalProperties({
      database: { fields: { cardProperties: exampleProperties } as any }
    });

    const extractedValues = extractCardProposalProperties({
      card: {
        fields: {
          properties: {
            [categoryProp.id]: categoryProp.options[0].id,
            [statusProp.id]: statusProp.options[0].id,
            [urlProp.id]: 'https://example.com'
          }
        } as any
      },
      databaseProperties: extractedSchema
    });

    expect(extractedValues).toMatchObject<ExtractedCardProposalProperties>({
      cardProposalCategory: {
        propertyId: categoryProp.id,
        optionId: categoryProp.options[0].id,
        value: categoryProp.options[0].value
      },
      cardProposalStatus: {
        propertyId: statusProp.id,
        optionId: statusProp.options[0].id,
        value: statusProp.options[0].value as any
      },
      cardProposalUrl: {
        propertyId: urlProp.id,
        value: 'https://example.com'
      }
    });
  });

  it('should work if only some properties are present', () => {
    const exampleProperties: IPropertyTemplate[] = [categoryProp];

    const extractedSchema = extractDatabaseProposalProperties({
      database: { fields: { cardProperties: exampleProperties } as any }
    });

    const extractedValues = extractCardProposalProperties({
      card: {
        fields: {
          properties: {
            [categoryProp.id]: categoryProp.options[0].id,
            [statusProp.id]: statusProp.options[0].id,
            [urlProp.id]: 'https://example.com'
          }
        } as any
      },
      databaseProperties: extractedSchema
    });

    expect(extractedValues).toMatchObject<Partial<ExtractedCardProposalProperties>>({
      cardProposalCategory: {
        propertyId: categoryProp.id,
        optionId: categoryProp.options[0].id,
        value: categoryProp.options[0].value
      }
    });
  });
});
