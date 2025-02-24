import type { BaseEventWithoutGroup } from './BaseEvent';

export type GithubAppConnectEvent = BaseEventWithoutGroup & {
  spaceId: string;
  installationId: string;
};

export type GithubIssueRewardCreateEvent = BaseEventWithoutGroup & {
  rewardId: string;
  issueId: number;
  repoId: number;
  action: string;
};

export interface GithubAppEventMap {
  github_app_connect: GithubAppConnectEvent;
  github_issue_reward_create: GithubIssueRewardCreateEvent;
}
