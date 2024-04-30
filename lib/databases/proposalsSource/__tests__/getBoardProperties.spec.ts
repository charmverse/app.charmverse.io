import type { IPropertyTemplate } from 'lib/databases/board';
import * as constants from 'lib/projects/formField';
import { getFieldConfig } from 'lib/projects/formField';
import { getFormInput, getProjectProfileFieldConfig } from 'testing/mocks/form';

import { getBoardProperties } from '../getBoardProperties';

describe('getBoardProperties', () => {
  it('Should return universal properties for proposals', () => {
    const properties = getBoardProperties({});

    expect(properties.some((r) => r.type === 'proposalUrl')).toBeTruthy();
    expect(properties.some((r) => r.type === 'proposalStatus')).toBeTruthy();
    expect(properties.some((r) => r.type === 'proposalAuthor')).toBeTruthy();
    expect(properties.some((r) => r.type === 'proposalEvaluationType')).toBeTruthy();
    expect(properties.some((r) => r.type === 'proposalStep')).toBeTruthy();
    expect(properties.some((r) => r.type === 'proposalReviewerNotes')).toBeTruthy();
  });

  it('Should return custom properties from proposals', () => {
    const customProperty: IPropertyTemplate = {
      id: 'custom-color',
      name: 'color',
      type: 'multiSelect',
      options: [{ id: 'red', color: 'red', value: 'red' }]
    };
    const properties = getBoardProperties({
      proposalCustomProperties: [
        { id: 'custom-color', name: 'color', type: 'multiSelect', options: [{ id: 'red', color: 'red', value: 'red' }] }
      ]
    });
    expect(properties).toEqual(
      expect.arrayContaining([
        {
          ...customProperty,
          readOnly: true,
          readOnlyValues: true
        }
      ])
    );
  });

  // in case we change our mind about defaults, since all these fields are readonly
  it('Should override previous configuration of custom properties', () => {
    const customProperty: IPropertyTemplate = {
      id: 'custom-color',
      name: 'color',
      type: 'multiSelect' as const,
      options: [{ id: 'red', color: 'red', value: 'red' }]
    };
    const specialId = 'custom-color-mirror-id';
    const properties = getBoardProperties({
      currentCardProperties: [
        {
          ...customProperty,
          id: specialId,
          dynamicOptions: true,
          readOnly: false,
          readOnlyValues: false
        }
      ],
      proposalCustomProperties: [
        { id: 'custom-color', name: 'color', type: 'multiSelect', options: [{ id: 'red', color: 'red', value: 'red' }] }
      ]
    });
    expect(properties).toEqual(
      expect.arrayContaining([
        {
          ...customProperty,
          readOnly: true,
          readOnlyValues: true
        }
      ])
    );
  });

  it('Should return universal properties for rubric steps', () => {
    const properties = getBoardProperties({
      rubricStepTitles: ['Rubric Evaluation']
    });
    expect(properties.some((r) => r.type === 'proposalEvaluatedBy')).toBeTruthy();
    expect(properties.some((r) => r.type === 'proposalEvaluationTotal')).toBeTruthy();
    expect(properties.some((r) => r.type === 'proposalEvaluationAverage')).toBeTruthy();
  });

  it('Should retain the id of an existing property when matching by type', () => {
    const properties = getBoardProperties({
      rubricStepTitles: ['Rubric Evaluation']
    });
    const property = properties.find((r) => r.type === 'proposalEvaluatedBy');
    expect(property?.id).toBeTruthy();
    const originalId = property?.id;
    const newProperties = getBoardProperties({
      currentCardProperties: properties,
      rubricStepTitles: ['Rubric Evaluation']
    });
    const updatedProperty = newProperties.find((r) => r.type === 'proposalEvaluatedBy');
    expect(updatedProperty?.id).toEqual(originalId);
  });

  it('Should return visible properties for project profile', () => {
    const properties = getBoardProperties({
      formFields: [
        getFormInput({
          id: 'project-profile-id',
          type: 'project_profile',
          fieldConfig: getProjectProfileFieldConfig()
        })
      ]
    });
    expect(properties.some((r) => r.id === constants.PROJECT_NAME_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_EXCERPT_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_DESCRIPTION_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_TWITTER_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_WEBSITE_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_GITHUB_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_BLOG_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_DEMO_URL_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_COMMUNITY_URL_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_OTHER_URL_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_WALLET_ID)).toBeTruthy();
    // project team members
    expect(properties.some((r) => r.id === constants.PROJECT_MEMBER_NAMES_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_MEMBER_WALLETS_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_MEMBER_EMAILS_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_MEMBER_TWITTERS_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_MEMBER_WARPCASTS_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_MEMBER_GITHUBS_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_MEMBER_LINKEDINS_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_MEMBER_TELEGRAMS_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_MEMBER_OTHER_URLS_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_MEMBER_PREVIOUS_PROJECTS_ID)).toBeTruthy();
  });

  it('Should return private properties for project profile', () => {
    const properties = getBoardProperties({
      formFields: [
        getFormInput({
          id: 'project-profile-id',
          type: 'project_profile',
          fieldConfig: getProjectProfileFieldConfig({
            walletAddress: { private: true },
            projectMember: {
              walletAddress: getFieldConfig({ private: true })
            }
          })
        })
      ]
    });
    const projectWalletProperty = properties.find((r) => r.id === constants.PROJECT_WALLET_ID);
    const projectMemberWalletProperty = properties.find((r) => r.id === constants.PROJECT_MEMBER_WALLETS_ID);
    expect(projectWalletProperty).toBeTruthy();
    expect(projectWalletProperty?.private).toBeTruthy();
    expect(projectMemberWalletProperty).toBeTruthy();
    expect(projectMemberWalletProperty?.private).toBeTruthy();
  });

  it('Should not return hidden properties for project profile', () => {
    const properties = getBoardProperties({
      formFields: [
        getFormInput({
          id: 'project-profile-id',
          type: 'project_profile',
          fieldConfig: getProjectProfileFieldConfig({
            website: { show: false }
          })
        })
      ]
    });

    expect(properties.some((r) => r.id === constants.PROJECT_WEBSITE_ID)).toBeFalsy();
  });
});
