import { ProposalStatus } from '@charmverse/core/prisma-client';
import { objectUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { IPropertyTemplate } from 'lib/databases/board';

import { getCardPropertyTemplates } from '../getCardPropertyTemplates';
import type { ProposalPropertiesMap } from '../getCardPropertyTemplates';

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

describe('getCardPropertyTemplates', () => {
  it('should extract database proposal properties', () => {
    const exampleProperties: IPropertyTemplate[] = [statusProp, urlProp];

    const extractedProps = getCardPropertyTemplates({
      cardProperties: exampleProperties
    });

    expect(extractedProps).toMatchObject<ProposalPropertiesMap>({
      proposalStatus: statusProp,
      proposalUrl: urlProp
    });
  });

  it('should work if only some properties are present', () => {
    const exampleProperties: IPropertyTemplate[] = [];

    const extractedProps = getCardPropertyTemplates({
      cardProperties: exampleProperties
    });

    expect(extractedProps).toMatchObject<Partial<ProposalPropertiesMap>>({});
  });
});
