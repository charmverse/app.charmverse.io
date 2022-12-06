import { MemberProperty } from '@prisma/client';
import { prisma } from 'db';
import { DEFAULT_MEMBER_PROPERTIES } from 'lib/members/constants';

async function updateBioProperty () {
  const spaces = await prisma.space.findMany({
    select: {
      memberProperties: {
        select: {
          id: true,
          type: true,
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  console.log('Total Spaces', spaces.length);
  let completedSpaces = 0;

  for (const space of spaces) {
    const { memberProperties } = space;
    const nonDefaultMemberProperties: Pick<MemberProperty, "id" | "type">[] = memberProperties.filter(mp => !DEFAULT_MEMBER_PROPERTIES.includes(mp.type));
    const defaultMemberPropertiesRecord: Record<string, Pick<MemberProperty, "id" | "type">> = {};
    memberProperties.forEach(mp => {
      if (DEFAULT_MEMBER_PROPERTIES.includes(mp.type)) {
        defaultMemberPropertiesRecord[mp.type] = mp;
      }
    })

    // await prisma.$transaction(
    //   [...DEFAULT_MEMBER_PROPERTIES_ORDER.map((mp, index) => prisma.memberProperty.update({
    //     where: {
    //       id: defaultMemberPropertiesRecord[mp].id
    //     },
    //     data: {
    //       index
    //     }
    //   })),
    //   ...nonDefaultMemberProperties.map((mp, index) => prisma.memberProperty.update({
    //     where: {
    //       id: mp.id
    //     },
    //     data: {
    //       index: DEFAULT_MEMBER_PROPERTIES_ORDER.length + index
    //     }
    //   }))
    // ],
    // )

    completedSpaces+=1;
    console.log(`Complete space ${completedSpaces}`);
  }
}

updateBioProperty();
