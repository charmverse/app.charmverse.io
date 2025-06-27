import { DataNotFoundError } from './errors';

export class SpaceNotFoundError extends DataNotFoundError {
  constructor(spaceId?: string) {
    super(`Space with id ${spaceId} not found`);
  }
}
