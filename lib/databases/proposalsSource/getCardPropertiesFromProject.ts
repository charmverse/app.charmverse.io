import type { Project, ProjectMember } from '@charmverse/core/prisma';

import type { FormFieldValue } from 'lib/forms/interfaces';
import * as constants from 'lib/projects/formField';
import { isTruthy } from 'lib/utils/types';

type PropertiesMap = Record<string, FormFieldValue>;

export type ProjectInformation = Project & {
  projectMembers: ProjectMember[];
};

export function getCardPropertiesFromProject(project: ProjectInformation): PropertiesMap {
  // sort by team lead, then by createdAt
  const members = project.projectMembers.sort((a, b) =>
    a.teamLead ? -1 : b.teamLead ? 1 : b.createdAt > a.createdAt ? -1 : 1
  );

  return {
    [constants.PROJECT_NAME_ID]: project.name,
    [constants.PROJECT_EXCERPT_ID]: project.excerpt ?? '',
    [constants.PROJECT_DESCRIPTION_ID]: project.description ?? '',
    [constants.PROJECT_TWITTER_ID]: project.twitter ?? '',
    [constants.PROJECT_WEBSITE_ID]: project.website ?? '',
    [constants.PROJECT_GITHUB_ID]: project.github ?? '',
    [constants.PROJECT_BLOG_ID]: project.blog ?? '',
    [constants.PROJECT_DEMO_URL_ID]: project.demoUrl ?? '',
    [constants.PROJECT_COMMUNITY_URL_ID]: project.communityUrl ?? '',
    [constants.PROJECT_OTHER_URL_ID]: project.otherUrl ?? '',
    [constants.PROJECT_WALLET_ID]: project.walletAddress ?? '',
    [constants.PROJECT_MEMBER_NAMES_ID]: members.map((member) => member.name).filter(isTruthy),
    [constants.PROJECT_MEMBER_WALLETS_ID]: members.map((member) => member.walletAddress).filter(isTruthy),
    [constants.PROJECT_MEMBER_EMAILS_ID]: members.map((member) => member.email).filter(isTruthy),
    [constants.PROJECT_MEMBER_TWITTERS_ID]: members.map((member) => member.twitter).filter(isTruthy),
    [constants.PROJECT_MEMBER_WARPCASTS_ID]: members.map((member) => member.warpcast).filter(isTruthy),
    [constants.PROJECT_MEMBER_GITHUBS_ID]: members.map((member) => member.github).filter(isTruthy),
    [constants.PROJECT_MEMBER_LINKEDINS_ID]: members.map((member) => member.linkedin).filter(isTruthy),
    [constants.PROJECT_MEMBER_TELEGRAMS_ID]: members.map((member) => member.telegram).filter(isTruthy),
    [constants.PROJECT_MEMBER_OTHER_URLS_ID]: members.map((member) => member.otherUrl).filter(isTruthy),
    [constants.PROJECT_MEMBER_PREVIOUS_PROJECTS_ID]: members.map((member) => member.previousProjects).filter(isTruthy)
  };
}
