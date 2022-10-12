import type { User, MemberProperty, MemberPropertyValue, UserDetails } from '@prisma/client';

import * as http from 'adapters/http';
import type { Member } from 'lib/members/interfaces';

type WorkspaceMembers = Member[]

function getWorkspaceMembers (): WorkspaceMembers {
  return [
    {
      profile: {
        id: '1234',
        description: 'Co-founder & CEO of CharmVerse, first Web 3 native all-in-one workspace - wiki, project management and more.',
        social: {
          twitterURL: 'charmverse',
          githubURL: 'app.charmverse.io',
          discordUsername: 'Charmverse#1234',
          linkedinURL: ''
        }
      },
      username: 'charmverse.eth',
      properties: [{
        id: '123',
        name: 'Profile pic',
        type: 'profile_pic',
        value: 'https://download.logo.wine/logo/Ethereum/Ethereum-Logo.wine.png'
      }]

    } as unknown as Member
  ];
}

export class MembersApi {
  getMembers (spaceId: string) {
    return http.GET<Member[]>(`/api/spaces/${spaceId}/members`);
  }

  getWorkspaceMembers (workspaceId: string) {
    // return http.POST<WorkspaceMembers>(`/api/space/${workspaceId}/members`);
    return getWorkspaceMembers();
  }
}
