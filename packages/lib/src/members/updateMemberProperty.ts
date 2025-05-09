import type { MemberProperty, PrismaPromise } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { NotFoundError } from '@packages/nextjs/errors';
import { UserIsNotSpaceMemberError } from '@packages/users/errors';
import { InvalidInputError } from '@packages/utils/errors';

type NewSelectOptionType = {
  id?: string;
  index?: number;
  name: string;
  color: string;
};

type ExistingSelectOption = NewSelectOptionType & {
  id: string;
};

type UpdatePropertyInput = {
  data: Partial<MemberProperty>;
  id: string;
  userId: string;
  spaceId: string;
};

export async function updateMemberProperty({
  data,
  id,
  userId,
  spaceId
}: UpdatePropertyInput): Promise<MemberProperty> {
  const spaceRole = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });

  const memberProperty = await prisma.memberProperty.findUniqueOrThrow({
    where: {
      id
    },
    select: {
      type: true,
      index: true,
      space: {
        select: {
          primaryMemberIdentity: true
        }
      }
    }
  });

  if (!spaceRole) {
    throw new UserIsNotSpaceMemberError();
  }

  let updateData = data;
  if (!spaceRole.isAdmin) {
    // non-admin users can only update select / multiselect property options
    if ((memberProperty?.type !== 'select' && memberProperty?.type !== 'multiselect') || !updateData.options) {
      throw new InvalidInputError('Invalid property data.');
    }

    updateData = { options: data.options };
  }

  const transactions: PrismaPromise<any>[] = [];
  const newIndex = data.index;
  const updateOptions = (data.options as ExistingSelectOption[]) || [];
  const hasDuplicatedOptions = updateOptions.some(
    (option, index, options) => options.findIndex((o) => o.name.toLowerCase() === option.name.toLowerCase()) !== index
  );

  if (hasDuplicatedOptions) {
    throw new InvalidInputError('Duplicated option names are not allowed.');
  }

  if (!data.required && memberProperty.space.primaryMemberIdentity?.toLowerCase() === memberProperty.type) {
    throw new InvalidInputError('Primary member identity cannot be optional.');
  }

  if (newIndex !== null && newIndex !== undefined) {
    if (!memberProperty) {
      throw new NotFoundError('member property not found');
    }

    const currentIndex = memberProperty.index;

    transactions.push(
      prisma.memberProperty.updateMany({
        where: {
          spaceId,
          index:
            currentIndex < newIndex
              ? {
                  gt: currentIndex,
                  lte: newIndex as number
                }
              : {
                  lt: currentIndex,
                  gte: newIndex as number
                }
        },
        data: {
          index:
            currentIndex < newIndex
              ? {
                  decrement: 1
                }
              : {
                  increment: 1
                }
        }
      })
    );
  }

  transactions.push(
    prisma.memberProperty.update({
      where: {
        id
      },
      data: { ...data, options: data.options ?? undefined, updatedBy: userId, id }
    })
  );

  const result = await prisma.$transaction(transactions);

  return result[result.length - 1] as MemberProperty;
}
