import type { Prisma } from '@charmverse/core/prisma';

export function getSpaceMemberSearchParams(search: string) {
  const searchString = `${search
    .split(/\s/)
    .filter((s) => s)
    .join(' & ')}:*`;

  const whereOr: Prisma.Enumerable<Prisma.SpaceRoleWhereInput> = [];

  if (search.length !== 0) {
    whereOr.push({
      user: {
        username: {
          search: searchString
        }
      }
    });

    whereOr.push({
      user: {
        profile: {
          description: {
            search: searchString
          }
        }
      }
    });

    whereOr.push({
      user: {
        wallets: {
          some: {
            ensname: {
              search: searchString
            }
          }
        }
      }
    });

    whereOr.push({
      user: {
        memberPropertyValues: {
          some: {
            OR: [
              {
                value: {
                  array_contains: search
                }
              },
              {
                value: {
                  string_contains: search
                }
              }
            ]
          }
        }
      }
    });

    whereOr.push({
      spaceRoleToRole: {
        some: {
          role: {
            name: {
              search: searchString
            }
          }
        }
      }
    });
  }

  return whereOr;
}
