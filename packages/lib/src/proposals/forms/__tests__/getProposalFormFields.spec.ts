import { getFormInput, getProjectProfileFieldConfig } from '@packages/testing/mocks/form';
import type { ProjectAndMembersFieldConfig } from '@packages/lib/projects/formField';

import { getProposalFormFields } from '../getProposalFormFields';

describe('getProposalFormFields', () => {
  it('Should not filter out private fields', () => {
    const formField = getFormInput({ private: true });
    const fields = getProposalFormFields({
      fields: [formField],
      canViewPrivateFields: true,
      currentEvaluationIndex: 0
    });
    expect(fields).toHaveLength(1);
  });

  it('Should filter out private fields', () => {
    const formField = getFormInput({ private: true });
    const fields = getProposalFormFields({
      fields: [formField],
      canViewPrivateFields: false,
      currentEvaluationIndex: 0
    });
    expect(fields).toHaveLength(0);
  });

  it('Should filter out project fields', () => {
    const formField = getFormInput({
      type: 'project_profile',
      fieldConfig: getProjectProfileFieldConfig({
        walletAddress: {
          show: true,
          private: true
        },
        projectMember: {
          walletAddress: {
            show: true,
            private: false
          },
          email: {
            show: true,
            private: true
          }
        }
      })
    });
    const fields = getProposalFormFields({
      fields: [formField],
      canViewPrivateFields: false,
      currentEvaluationIndex: 0
    });
    expect(fields).toHaveLength(1);
    const fieldConfig = fields![0].fieldConfig as ProjectAndMembersFieldConfig;
    expect(fieldConfig.walletAddress.show).toBe(false);
    expect(fieldConfig.projectMember.walletAddress.show).toBe(true); // test a non-private field
    expect(fieldConfig.projectMember.email.show).toBe(false);
  });
});
