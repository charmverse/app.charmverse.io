import type { Project, ProjectMember } from '@charmverse/core/prisma';
import { isTruthy } from '@packages/utils/types';
import * as constants from '@root/lib/projects/formField';
import type { FormFieldValue } from '@root/lib/proposals/forms/interfaces';

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
    [constants.PROJECT_DESCRIPTION_ID]: project.description ?? '',
    [constants.PROJECT_TWITTER_ID]: project.twitter ?? '',
    [constants.PROJECT_GITHUB_ID]: project.github ?? '',
    [constants.PROJECT_WEBSITE_ID]: project.websites ?? '',
    [constants.PROJECT_WALLET_ID]: project.walletAddress ?? '',
    [constants.PROJECT_MEMBER_NAMES_ID]: members.map((member) => member.name).filter(isTruthy),
    [constants.PROJECT_MEMBER_WALLETS_ID]: members.map((member) => member.walletAddress).filter(isTruthy),
    [constants.PROJECT_MEMBER_SOCIAL_URLS_ID]: members
      .map((member) => member.socialUrls)
      .flat()
      .filter(isTruthy),
    [constants.PROJECT_MEMBER_EMAILS_ID]: members.map((member) => member.email).filter(isTruthy)
  };
}
