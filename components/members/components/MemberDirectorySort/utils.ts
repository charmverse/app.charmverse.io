import type { MemberProperty } from '@prisma/client';

import type { Social } from 'components/profile/interfaces';
import type { Member } from 'lib/members/interfaces';

export function sortMembers(members: Member[], property: MemberProperty) {
  switch (property.type) {
    case 'phone':
    case 'email':
    case 'text':
    case 'text_multiline':
    case 'url':
      return members.sort((memA, memB) => {
        const memberAProperty = memA.properties.find((prop) => prop.memberPropertyId === property.id);
        const memberBProperty = memB.properties.find((prop) => prop.memberPropertyId === property.id);
        return (memberAProperty?.value ?? '') > (memberBProperty?.value ?? '') ? 1 : -1;
      });
    case 'name':
      return members.sort((memA, memB) => {
        const memberAProperty = memA.properties.find((prop) => prop.memberPropertyId === property.id);
        const memberBProperty = memB.properties.find((prop) => prop.memberPropertyId === property.id);
        // Use username if value is empty
        return (memberAProperty?.value ?? memA.username) > (memberBProperty?.value ?? memB.username) ? 1 : -1;
      });
    case 'timezone': {
      return members.sort((memA, memB) => {
        const memberATimezone = memA.profile?.timezone;
        const memberBTimezone = memB.profile?.timezone;
        return (memberATimezone ?? '') > (memberBTimezone ?? '') ? 1 : -1;
      });
    }
    case 'discord': {
      return members.sort((memA, memB) => {
        const memberADiscordUsername = (memA.profile?.social as Partial<Social>)?.discordUsername;
        const memberBDiscordUsername = (memB.profile?.social as Partial<Social>)?.discordUsername;
        return (memberADiscordUsername ?? '') > (memberBDiscordUsername ?? '') ? 1 : -1;
      });
    }
    case 'join_date': {
      return members.sort((memA, memB) => {
        return memA.joinDate > memB.joinDate ? 1 : -1;
      });
    }
    case 'twitter': {
      return members.sort((memA, memB) => {
        const memberATwitterURL = (memA.profile?.social as Partial<Social>)?.twitterURL;
        const memberBTwitterURL = (memB.profile?.social as Partial<Social>)?.twitterURL;
        return (memberATwitterURL ?? '') > (memberBTwitterURL ?? '') ? 1 : -1;
      });
    }
    case 'number': {
      return members.sort((memA, memB) => {
        const memberAProperty = memA.properties.find((prop) => prop.memberPropertyId === property.id);
        const memberBProperty = memB.properties.find((prop) => prop.memberPropertyId === property.id);
        return (memberAProperty?.value ?? 0) > (memberBProperty?.value ?? 0) ? 1 : -1;
      });
    }
    default: {
      return members;
    }
  }
}
