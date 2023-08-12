export const memberProfileNames = ['charmverse', 'collection', 'ens', 'lens', 'summon'] as const;

export type MemberProfileName = (typeof memberProfileNames)[number];

export const memberProfileLabels: Record<MemberProfileName, string> = {
  charmverse: 'CharmVerse',
  collection: 'Collection',
  ens: 'ENS',
  lens: 'Lens',
  summon: 'Summon'
};

export type MemberProfileJson = {
  id: MemberProfileName;
  isHidden: boolean;
};
