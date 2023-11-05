import type { MemberProperty } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type { Social, Member } from 'lib/members/interfaces';

const createdAt = new Date('2023-07-19T00:00:00.000Z');

export function createMemberProperty(
  memberProperty: Pick<MemberProperty, 'name' | 'index' | 'type' | 'spaceId' | 'createdBy' | 'updatedBy'>
): MemberProperty {
  return {
    createdAt,
    id: v4(),
    updatedAt: createdAt,
    enabledViews: ['gallery', 'table', 'profile'],
    options: null,
    ...memberProperty
  };
}

export function createMemberPropertyValue(member: Member, memberPropertyType: MemberProperty['type']) {
  switch (memberPropertyType) {
    case 'profile_pic':
      return member.avatar;
    case 'name':
      return member.username;
    case 'role':
      return member.roles;
    case 'bio':
      return member.profile?.description;
    case 'discord':
      return (member.profile?.social as Social)?.discordUsername;
    case 'twitter':
      return (member.profile?.social as Social)?.twitterURL;
    case 'linked_in':
      return (member.profile?.social as Social)?.linkedinURL;
    case 'github':
      return (member.profile?.social as Social)?.githubURL;
    case 'timezone':
      return member.profile?.timezone;
    case 'join_date':
      return member.joinDate;
    default:
      return '';
  }
}
