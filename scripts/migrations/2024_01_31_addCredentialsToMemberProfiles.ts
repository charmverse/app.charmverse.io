import { prisma } from '@charmverse/core/prisma-client';
import { MemberProfileJson } from 'lib/profile/memberProfiles';

async function addCredentialsToMemberProfiles() {
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      memberProfiles: true
    }
  });

  const totalSpaces = spaces.length;
  let currentSpace = 1;

  for (const space of spaces) {
    try {
      const spaceMemberProfiles = ((space.memberProfiles || []) as MemberProfileJson[]).filter(
        (memberProfile) => memberProfile.id !== 'credentials'
      );
      spaceMemberProfiles.splice(space.memberProfiles.length === 0 ? 0 : 1, 0, {
        id: 'credentials',
        isHidden: false
      });

      await prisma.space.update({
        where: {
          id: space.id
        },
        data: {
          memberProfiles: spaceMemberProfiles
        }
      });
      console.log(`Updated ${currentSpace} of ${totalSpaces} spaces`);
    } catch (_) {
      console.log(`Failed to update space ${space.id}`);
    } finally {
      currentSpace++;
    }
  }
}

addCredentialsToMemberProfiles();
