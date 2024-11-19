import { cache } from 'react';

import { getUserByPath } from './getUserByPath';

export const getUserByPathCached = cache(getUserByPath);
