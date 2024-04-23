import * as constants from 'lib/projects/formField';
import { getFieldConfig } from 'lib/projects/formField';
import { getFormInput, getProfectProfileFieldConfig } from 'testing/mocks/form';

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
    const customProperty = {
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
          proposalFieldId: customProperty.id,
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

  it('Should return visible properties for project profile', () => {
    const properties = getBoardProperties({
      formFields: [
        getFormInput({
          id: 'project-profile-id',
          type: 'project_profile',
          fieldConfig: getProfectProfileFieldConfig()
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
          fieldConfig: getProfectProfileFieldConfig({
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
          fieldConfig: getProfectProfileFieldConfig({
            website: { show: false }
          })
        })
      ]
    });

    expect(properties.some((r) => r.id === constants.PROJECT_WEBSITE_ID)).toBeFalsy();
  });
});
