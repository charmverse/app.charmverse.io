import { prisma } from 'db';
import { DatabasePageNotFoundError } from 'lib/public-api/errors';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';
import type { AddFormResponseInput } from 'lib/zapier/interfaces';

export async function validateFormRequestInput({
  spaceId,
  databaseId,
  data
}: {
  spaceId: string;
  databaseId: string;
  data: AddFormResponseInput;
}) {
  let invalidData = false;
  if (!data) {
    invalidData = true;
  } else if (Array.isArray(data)) {
    invalidData = !data.every((entry) => entry.question && 'answer' in entry);
  } else if (typeof data !== 'string') {
    invalidData = !data.all_responses;
  }

  if (invalidData) {
    throw new InvalidInputError(`Invalid input data`);
  }

  if (!isUUID(databaseId)) {
    throw new InvalidInputError(`Invalid database id: ${databaseId}`);
  }

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: databaseId,
      spaceId
    }
  });

  if (!board) {
    throw new DatabasePageNotFoundError(databaseId);
  }

  return true;
}
