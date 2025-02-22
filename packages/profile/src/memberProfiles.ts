export const memberProfileNames = ['charmverse', 'collection', 'ens', 'lens', 'summon', 'credentials'] as const;

export type MemberProfileName = (typeof memberProfileNames)[number];

export const memberProfileLabels: Record<MemberProfileName, string> = {
  charmverse: 'CharmVerse',
  collection: 'Collection',
  ens: 'ENS',
  lens: 'Lens',
  summon: 'Summon',
  credentials: 'Credentials'
};

export type MemberProfileJson = {
  id: MemberProfileName;
  isHidden: boolean;
};
