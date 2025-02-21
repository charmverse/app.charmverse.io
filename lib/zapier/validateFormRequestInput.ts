import { InvalidInputError } from '@packages/utils/errors';
import { getDatabaseDetails } from '@root/lib/pages/getDatabaseDetails';
import { DatabasePageNotFoundError } from '@root/lib/public-api/errors';
import type { AddFormResponseInput } from '@root/lib/zapier/interfaces';

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
    const values = Object.values(data);
    const isDictObject = values.every((value) => typeof value === 'string');
    invalidData = !values.length || (!isDictObject && !data.all_responses);
  }

  if (invalidData) {
    throw new InvalidInputError(`Invalid input data`);
  }

  // Check if database exists
  await getDatabaseDetails({ spaceId, idOrPath: databaseIdOrPath });

  return true;
}
