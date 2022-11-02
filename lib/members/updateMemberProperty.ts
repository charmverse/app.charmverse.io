import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import type { ExistingSelectOption } from 'lib/forms/Interfaces';
import { InvalidInputError } from 'lib/utilities/errors';

type UpdatePropertyInput = {
  data: Prisma.MemberPropertyUpdateInput;
  id: string;
  userId: string;
}

export function updateMemberProperty ({ data, userId, id }: UpdatePropertyInput) {
  const updateOptions = data.options as ExistingSelectOption[] || [];
  const hasDuplicatedOptions = updateOptions
    .some((option, index, options) => options.findIndex(o => o.name.toLowerCase() === option.name.toLowerCase()) !== index);

  if (hasDuplicatedOptions) {
    throw new InvalidInputError('Duplicated option names are not allowed.');
  }

  return prisma.memberProperty.update({
    where: {
      id
    },
    data: { ...data, updatedBy: userId, id }
  });
}
