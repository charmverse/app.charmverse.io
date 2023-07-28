import { ProposalStatus } from '@charmverse/core/prisma-client';
import { objectUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { IPropertyTemplate } from 'lib/focalboard/board';

import type { ExtractedDatabaseProposalProperties } from '../utils';
import { extractDatabaseProposalProperties } from '../utils';

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

describe('extractDatabaseProposalProperties', () => {
  it('should extract database proposal properties', () => {
    const exampleProperties: IPropertyTemplate[] = [categoryProp, statusProp, urlProp];

    const extractedProps = extractDatabaseProposalProperties({
      database: {
        fields: {
          cardProperties: exampleProperties
        } as any
      }
    });

    expect(extractedProps).toMatchObject<ExtractedDatabaseProposalProperties>({
      proposalCategory: categoryProp,
      proposalStatus: statusProp,
      proposalUrl: urlProp
    });
  });

  it('should work if only some properties are present', () => {
    const exampleProperties: IPropertyTemplate[] = [categoryProp];

    const extractedProps = extractDatabaseProposalProperties({
      database: {
        fields: {
          cardProperties: exampleProperties
        } as any
      }
    });

    expect(extractedProps).toMatchObject<Partial<ExtractedDatabaseProposalProperties>>({
      proposalCategory: categoryProp
    });
  });
});
