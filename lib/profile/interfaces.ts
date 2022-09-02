
export interface UserCommunity {
  id: string;
  name: string;
  isHidden: boolean;
  logo: string | null;
}

export interface ProfileBountyEvent {
  bountyId: string;
  bountyPath: string;
  createdAt: string;
  organizationId: string;
  eventName: 'bounty_created' | 'bounty_started' | 'bounty_completed';
  bountyTitle?: string;
  hasCredential?: boolean;
}
