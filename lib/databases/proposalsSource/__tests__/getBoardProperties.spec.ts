import type { FormField, Prisma, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { objectUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { FormFieldInput } from 'components/common/form/interfaces';
import type { BoardFields, IPropertyTemplate } from 'lib/databases/board';
import { proposalPropertyTypesList } from 'lib/databases/board';
import { InvalidStateError } from 'lib/middleware';
import { createDefaultProjectAndMembersFieldConfig } from 'lib/projects/formField';
import { getFormInput } from 'testing/mocks/form';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal } from 'testing/utils/proposals';

import { EVALUATION_STATUS_LABELS } from '../../proposalDbProperties';
import { getBoardProperties } from '../getBoardProperties';

const statusPropertyOptions = objectUtils.typedKeys(EVALUATION_STATUS_LABELS);

describe('getBoardProperties', () => {
  let space: Space;
  let user: User;

  it('Should return universal properties for proposals', () => {
    const result = getBoardProperties({});
    proposalPropertyTypesList.forEach((property) => {
      expect(result.some((r) => r.type === property));
    });
  });

  it('Should return properties for project profile', () => {
    const result = getBoardProperties({
      formFields: [
        getFormInput({
          id: 'project-profile-id',
          type: 'project_profile',
          fieldConfig: createDefaultProjectAndMembersFieldConfig()
        })
      ]
    });
    proposalPropertyTypesList.forEach((property) => {
      expect(result.some((r) => r.type === property));
    });
  });
});
