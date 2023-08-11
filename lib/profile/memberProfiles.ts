export const memberProfileNames = ['charmverse', 'collection', 'ens', 'lens', 'summon'] as const;

export type MemberProfileName = (typeof memberProfileNames)[number];

export type MemberProfileJson = {
  id: MemberProfileName;
  isHidden: boolean;
};
