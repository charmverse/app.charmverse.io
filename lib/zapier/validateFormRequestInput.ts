import { getDatabaseDetails } from 'lib/pages/getDatabaseDetails';
import { DatabasePageNotFoundError } from 'lib/public-api/errors';
import { InvalidInputError } from 'lib/utilities/errors';
import type { AddFormResponseInput } from 'lib/zapier/interfaces';

export async function validateFormRequestInput({
  spaceId,
  databaseIdOrPath,
  data
}: {
  spaceId: string;
  databaseIdOrPath: string;
  data: AddFormResponseInput;
}) {
  let invalidData = false;
  if (!data) {
    invalidData = true;
  } else if (Array.isArray(data)) {
    invalidData = !data.every((entry) => entry.question && 'answer' in entry);
  } else if (typeof data !== 'string') {
    const isDictObject = Object.values(data).every((value) => typeof value === 'string');
    invalidData = !isDictObject && !data.all_responses;
  }

  if (invalidData) {
    throw new InvalidInputError(`Invalid input data`);
  }

  const board = await getDatabaseDetails({ spaceId, idOrPath: databaseIdOrPath });

  if (!board) {
    throw new DatabasePageNotFoundError(databaseIdOrPath);
  }

  return true;
}
