import type { User, MemberProperty, MemberPropertyValue, UserDetails } from '@prisma/client';

import * as http from 'adapters/http';
import type { Member } from 'models';

type WorkspaceMembers = {
  user: User & { profile: UserDetails };
  properties: (MemberProperty & { value: MemberPropertyValue })[];
}[]

function getWorkspaceMembers (): WorkspaceMembers {
  return [
    {
      properties: [{
        type: 'profile_pic',
        value: {
          value: 'https://download.logo.wine/logo/Ethereum/Ethereum-Logo.wine.png'
        }
      }],
      user: {
        profile: {
          description: 'Co-founder & CEO of CharmVerse, first Web 3 native all-in-one workspace - wiki, project management and more.',
          social: {
            twitterURL: 'charmverse',
            githubURL: 'app.charmverse.io',
            discordUsername: 'Charmverse#1234',
            linkedinURL: ''
          }
        },
        username: 'charmverse.eth'
      }
    }
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
