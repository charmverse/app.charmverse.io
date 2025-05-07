import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { checkDiscordGate } from '@packages/lib/discord/collabland/checkDiscordGate';
import { getDiscordUserState } from '@packages/lib/collabland/collablandClient';
import { uniq } from 'lodash';

import { createAndAssignCollablandRoles } from '@packages/lib/collabland/assignRolesCollabland';
async function query() {
  const myosinServer = await prisma.space.findFirstOrThrow({
    where: {
      domain: 'myosinxyz'
    },
    include: {
      apiToken: true,
      superApiToken: true
    }
  });
  //console.log('myosinServer', myosinServer);

  // const perms = await prisma.pagePermission.findMany({
  //   where: {
  //     userId: {
  //       not: null
  //     },
  //     spaceId: myosinServer.id
  //   },
  //   select: {
  //     userId: true
  //   }
  // });
  // console.log('perms', perms.length);

  // const pages = await prisma.page.findMany({
  //   where: {
  //     spaceId: myosinServer.id
  //   },
  //   select: {
  //     createdBy: true
  //   }
  // });
  // console.log('pages', pages.length);

  // const edits = await prisma.pageDiff.findMany({
  //   where: {
  //     page: {
  //       spaceId: myosinServer.id
  //     }
  //   },
  //   select: {
  //     createdBy: true
  //   }
  // });
  // console.log('edits', edits.length);
  // const userIds = uniq(
  //   perms
  //     .map((p) => p.userId)
  //     .concat(edits.map((e) => e.createdBy))
  //     .concat(pages.map((p) => p.createdBy))
  //     .filter(Boolean)
  // );
  // const usersToCheck = await prisma.user.findMany({
  //   where: {
  //     discordUser: {
  //       isNot: null
  //       // address: '0x30f48cdd4325cb707ec7926f22536e6e0dfae01f'
  //     },
  //     spaceRoles: {
  //       none: {}
  //     }
  //   },
  //   select: {
  //     id: true
  //   }
  // });
  const userIds = [
    '9b79bf9a-37a5-439e-bc5b-ca6c8aac5544',
    'df962c07-5902-44d3-a5fe-16f6aebc02a8',
    'd314be86-75b0-48b9-a9cd-7bf35cd35ab8',
    'a4784521-1aa7-4cf3-b5e4-4da308845c77',
    'd58646fe-484a-4b15-b321-164fd1bd20ef',
    '97a6cd55-80e3-467a-84a6-1238eca33a88',
    'c138a169-b5e9-4f23-9098-dd5ebe773e24',
    '8fc42010-50e5-4f06-9ae1-74347487b07c',
    '869485dc-d7cc-4c25-8188-f4ffecf08812',
    'ceb0efe9-faac-4a1f-aa37-c87f10e06bb3',
    '74d097a7-8baa-483c-aa62-2eab7db8725a',
    'e4412173-bb5a-4895-a451-f472856691de',
    '5d8462e8-5d4d-4a3d-b4b1-d8a819f43e26',
    'b7a67c08-2403-4a13-87fd-3672ca36308f',
    '4d22c025-d679-4949-9041-eb56de7f06dd',
    'debe2fed-adad-42c9-97dd-574c5121e335',
    'a0e0a875-1b00-4463-a466-6eeff16a4b22',
    'ab9fb428-4b76-4561-ae5a-d94fa9fb4a25',
    '06592845-a8a4-4d71-8f0b-54576395a143',
    '90dcb8d9-23e6-45ce-b1e5-3da790b7ea21',
    '06fb5545-7574-41b0-b637-ba6c159114b1',
    'cb9a5ede-6ff7-4eaa-9c23-91e684e23aed',
    '0b756080-8e18-45ac-8ca4-e8e61604583d',
    '8a4be140-cee3-41fc-a15a-1f81978d523a',
    '305fa14d-d545-4f71-8581-6f338f822ad8',
    '62647b86-2f06-4a05-8aa7-faed9dd29b32',
    '2cb9dfe7-4b66-41f4-a2c2-69ef50fe8c91',
    'f290ced8-8069-46ea-9420-d4d3782d5e30',
    '1d8bb7d5-42a8-40e7-886a-0af6d25c6bba',
    'e2a5eedc-fef8-4e84-9f09-467cff0722ac',
    'ca4b9e2f-1a04-453a-a138-a7dbf6b42245',
    'c6de0d24-dcf9-483f-8548-142944489a43',
    '595d8425-8fad-4741-a120-2549f8b69480',
    'bb90d629-5492-4dea-b45e-80abc636821e',
    '565d8cd6-3595-40ae-89fa-91e4ebf504c2',
    'b8897b91-ab52-404d-bcfa-118787e8efee',
    '1a0b15ee-50d2-4e33-912a-59bdf75e234d',
    'f93a7c55-d961-4772-bc0c-7a99d11ef953',
    '9180690a-88f9-4b55-bbdd-df5fce9b31db',
    '692f53af-9344-4d94-8281-79ec4b7eaa0d',
    '4302332d-c6d5-4964-818e-5dc90a282582',
    '71280a09-7e03-4f40-a5bc-f29adc298c8a',
    '0c7a1aab-0134-4315-9351-caf76f4bc604',
    'e9c3d854-ec00-4989-b346-173a5fc12014',
    '6e728dd6-6308-4f2a-bc5d-5980b545502c',
    'dc9a3163-44f7-41ba-9018-30228ae149b8',
    '6bb96b81-e083-4998-a4bd-17049574eeb1',
    'b81ac1d6-ecac-455f-99a8-423ebfe4e039',
    'ff721f4d-b67e-488d-ac56-acb1f3cb3072',
    'ea6d518a-1f53-4b60-ba9b-47336c7def52',
    'f029ffab-6bc7-4014-ac98-88cc65850bd6',
    '41d8dff1-ebf5-442f-b771-551a54b3e14c',
    '2abd5f97-dc0b-4415-9a0f-2228e6b129fb',
    '5c9846d5-d2f6-404b-bd98-862aa0fa9475',
    'c49e0c20-2300-4ae2-af55-331de3a76cfc',
    'b9be2212-46c5-48ac-b50d-b8b336128046',
    'cdc3cdcb-e3c5-4c34-8219-e2ca5cf7d9cf',
    '3e8aa01f-5606-4af0-b578-89b8829411a5',
    'cdf10489-fc8b-4b08-92dc-1a3d4ec9fac3',
    'e5dba747-be62-49be-a7ba-71cf27b17174',
    'badb85ad-0000-4a24-9eee-0ed6c5b528ff',
    '36580836-cb2c-408e-81a9-cf310cf74a14',
    '5456438a-8f49-4ad1-bbb2-4a9ef884e323',
    'f50534c5-22e7-47ee-96cb-54f4ce1a0e3e',
    'dff53b9f-d45a-4360-a7aa-4a4b754e70c8',
    'fc73b502-139d-4704-a96b-9e27d959987a',
    '431c3752-b3f8-4098-aa62-27e195bfacc0',
    'fd74976a-c785-45f7-83a1-706b9d707331',
    '3b264d42-8630-4ad8-bdb8-845dcb8385d4',
    '5906c806-9497-43c7-9ffc-2eecd3c3a3ec',
    '061e993f-fce3-4c28-83c9-0f4a6dde9da2',
    'd5b4e5db-868d-47b0-bc78-ebe9b5b2c835',
    '8a3f4e25-d502-41c0-b50a-879d1565b02d',
    '409292cb-c344-4525-b723-8fc74584f0b3',
    '6967c0c8-8492-4d0c-8763-e5057e1338e3',
    'e0ec0ec8-0c1f-4745-833d-52c448482d9c',
    '1c1a7362-c9cb-45ec-8787-f2f1b8f09a26',
    '01f0e948-d8cb-4dfa-a469-d06d28262985',
    'bab066ad-4872-4704-997a-d317e6ac3f99',
    '29a733cb-95f8-43f0-b714-46e326e4f723',
    '9f91cba4-aabd-45f4-b40a-74c98a3455ae',
    'dc521ceb-495e-40cc-940e-3b1cafc7a2e1',
    '52983222-634b-4982-a9d6-e479f4622d8c',
    '7ef5a993-dd9f-46e2-9693-0ebce72de452',
    '93f03a10-ce1d-420b-b664-bb1dbb8a1309',
    '35c4f502-0a05-4f8a-979b-8b02d3bfbe5f',
    'd92c5641-794e-4760-aecc-baf1ca80d5fa',
    '7b870b57-d814-4913-8f79-fe4929916c17',
    '5eb22d63-9566-493e-9ad7-ffe2dec44a9c',
    '1db5ccfb-7352-45c7-ae19-38b3fd2cf93b',
    '3953400c-21ba-4d4c-9c3d-79791a8ef002',
    '43135ffd-f33f-4a93-ae33-af479c2353fb',
    '7bae355d-0a0c-402a-9b72-1074c3d2748e',
    '4e1d4522-6437-4393-8ed1-9c56e53235f4',
    '54578afc-4c99-4b1d-9bf1-c6997d8b007c',
    '2f351b6f-da73-404e-8662-04131abbdf12'
  ];
  console.log('userIds', userIds.length);

  const users = await prisma.discordUser.findMany({
    where: {
      user: {
        deletedAt: null,
        id: {
          in: userIds as string[]
        },
        spaceRoles: {
          none: {
            spaceId: myosinServer.id
          }
        }
      }
    },
    include: {
      user: {
        include: {
          spaceRoles: true
        }
      }
    }
  });
  // console.log(
  //   'unique users',
  //   users.map((u) => u.user.id)
  // );
  console.log('users without space roles', users.filter((u) => u.user.spaceRoles.length === 0).length);

  for (const user of users) {
    try {
      const state = await getDiscordUserState({
        discordServerId: myosinServer.discordServerId!,
        discordUserId: user.discordId
      });
      // console.log(state);
      if (state.isVerified) {
        const hasRole = user.user.spaceRoles.some((r) => r.spaceId === myosinServer.id);
        if (hasRole) {
          console.log('user already has role');
          continue;
        }
        await prisma.spaceRole.create({
          data: {
            userId: user.user.id,
            spaceId: myosinServer.id
          }
        });
        await createAndAssignCollablandRoles({
          roles: state.roles.map((r) => String(r.id)),
          spaceId: myosinServer.id,
          userId: user.user.id
        });
        console.log('Added user back:', user.user.username, user.user.id);
      } else {
        //console.log('not verified');
      }
    } catch (e) {
      console.log(e);
    }
    if (users.indexOf(user) % 20 === 0) {
      console.log('processed', users.indexOf(user));
    }
  }
}

async function query2() {
  const myosinServer = await prisma.space.findFirstOrThrow({
    where: {
      domain: 'myosinxyz'
    },
    include: {
      apiToken: true,
      superApiToken: true
    }
  });

  const missing = await await prisma.userSpaceAction.findMany({
    where: {
      spaceId: myosinServer.id,
      user: {
        discordUser: {
          isNot: null
          // address: '0x30f48cdd4325cb707ec7926f22536e6e0dfae01f'
        },
        spaceRoles: {
          none: {
            id: myosinServer.id
          }
        }
      }
    },
    select: {
      createdBy: true
    }
    // include: {
    //   spaceRoles: true,
    //   discordUser: true
    // }
  });
  const userIdss = missing.map((u) => u.createdBy);
  const uniqed = uniq(userIdss);
  console.log(uniqed);
  console.log('users to add', uniqed.length);
  return;
  const userIds = [
    'd58646fe-484a-4b15-b321-164fd1bd20ef',
    'cb9a5ede-6ff7-4eaa-9c23-91e684e23aed',
    'f7d47848-f993-4d16-8008-e1f5b23b8ad3',
    'c189ad1e-09b7-48a8-bb29-c1feb570c6ac',
    '5906c806-9497-43c7-9ffc-2eecd3c3a3ec',
    'c49e0c20-2300-4ae2-af55-331de3a76cfc',
    '5d8462e8-5d4d-4a3d-b4b1-d8a819f43e26',
    'ea6d518a-1f53-4b60-ba9b-47336c7def52',
    'fc73b502-139d-4704-a96b-9e27d959987a',
    'f029ffab-6bc7-4014-ac98-88cc65850bd6',
    '43135ffd-f33f-4a93-ae33-af479c2353fb',
    'b7a67c08-2403-4a13-87fd-3672ca36308f',
    '05faecc4-a08d-4912-b954-17fd37524f11',
    '9f91cba4-aabd-45f4-b40a-74c98a3455ae',
    '3953400c-21ba-4d4c-9c3d-79791a8ef002',
    '06fb5545-7574-41b0-b637-ba6c159114b1',
    '1db5ccfb-7352-45c7-ae19-38b3fd2cf93b',
    '431c3752-b3f8-4098-aa62-27e195bfacc0',
    '35c4f502-0a05-4f8a-979b-8b02d3bfbe5f',
    '565d8cd6-3595-40ae-89fa-91e4ebf504c2',
    '0c7a1aab-0134-4315-9351-caf76f4bc604',
    'b8897b91-ab52-404d-bcfa-118787e8efee',
    '52983222-634b-4982-a9d6-e479f4622d8c',
    '93f03a10-ce1d-420b-b664-bb1dbb8a1309',
    '8a3f4e25-d502-41c0-b50a-879d1565b02d',
    '5eb22d63-9566-493e-9ad7-ffe2dec44a9c',
    '01f0e948-d8cb-4dfa-a469-d06d28262985',
    'b81ac1d6-ecac-455f-99a8-423ebfe4e039',
    '7ef5a993-dd9f-46e2-9693-0ebce72de452',
    '71280a09-7e03-4f40-a5bc-f29adc298c8a',
    '2f351b6f-da73-404e-8662-04131abbdf12',
    'd5b4e5db-868d-47b0-bc78-ebe9b5b2c835',
    'df962c07-5902-44d3-a5fe-16f6aebc02a8',
    'debe2fed-adad-42c9-97dd-574c5121e335',
    '3b264d42-8630-4ad8-bdb8-845dcb8385d4',
    '5456438a-8f49-4ad1-bbb2-4a9ef884e323',
    '01f0e948-d8cb-4dfa-a469-d06d28262985',
    '05faecc4-a08d-4912-b954-17fd37524f11',
    '06fb5545-7574-41b0-b637-ba6c159114b1',
    '0c7a1aab-0134-4315-9351-caf76f4bc604',
    '1db5ccfb-7352-45c7-ae19-38b3fd2cf93b',
    '2f351b6f-da73-404e-8662-04131abbdf12',
    '35c4f502-0a05-4f8a-979b-8b02d3bfbe5f',
    '3953400c-21ba-4d4c-9c3d-79791a8ef002',
    '3b264d42-8630-4ad8-bdb8-845dcb8385d4',
    '43135ffd-f33f-4a93-ae33-af479c2353fb',
    '431c3752-b3f8-4098-aa62-27e195bfacc0',
    '52983222-634b-4982-a9d6-e479f4622d8c',
    '5456438a-8f49-4ad1-bbb2-4a9ef884e323',
    '565d8cd6-3595-40ae-89fa-91e4ebf504c2',
    '5906c806-9497-43c7-9ffc-2eecd3c3a3ec',
    '5d8462e8-5d4d-4a3d-b4b1-d8a819f43e26',
    '5eb22d63-9566-493e-9ad7-ffe2dec44a9c',
    '71280a09-7e03-4f40-a5bc-f29adc298c8a',
    '7ef5a993-dd9f-46e2-9693-0ebce72de452',
    '8a3f4e25-d502-41c0-b50a-879d1565b02d',
    '93f03a10-ce1d-420b-b664-bb1dbb8a1309',
    '9f91cba4-aabd-45f4-b40a-74c98a3455ae',
    'b7a67c08-2403-4a13-87fd-3672ca36308f',
    'b81ac1d6-ecac-455f-99a8-423ebfe4e039',
    'b8897b91-ab52-404d-bcfa-118787e8efee',
    'c189ad1e-09b7-48a8-bb29-c1feb570c6ac',
    'c49e0c20-2300-4ae2-af55-331de3a76cfc',
    'cb9a5ede-6ff7-4eaa-9c23-91e684e23aed',
    'd58646fe-484a-4b15-b321-164fd1bd20ef',
    'd5b4e5db-868d-47b0-bc78-ebe9b5b2c835',
    'debe2fed-adad-42c9-97dd-574c5121e335',
    'df962c07-5902-44d3-a5fe-16f6aebc02a8',
    'ea6d518a-1f53-4b60-ba9b-47336c7def52',
    'f029ffab-6bc7-4014-ac98-88cc65850bd6',
    'f7d47848-f993-4d16-8008-e1f5b23b8ad3',
    'fc73b502-139d-4704-a96b-9e27d959987a'
  ];

  const users = await prisma.discordUser.findMany({
    where: {
      user: {
        id: {
          in: userIds as string[]
        },
        spaceRoles: {
          some: {
            spaceId: myosinServer.id
          }
        }
      }
    },
    include: {
      user: {
        include: {
          spaceRoles: true
        }
      }
    }
  });
  const newUsers = users.filter(
    (u) => u.user.spaceRoles.find((s) => s.spaceId === myosinServer.id)!.createdAt < new Date('2024-10-03')
  );
  console.log('user ids', userIds.length);
  console.log('users not in space', users.length);
  console.log('new users', newUsers.length);
  // console.log('users without space roles', users.filter((u) => u.user.spaceRoles.length === 0).length);
}

query();
