import { init } from '@paralleldrive/cuid2';

/**
 * Create by default a cuid with length 10
 */
export const createCuid = init({
  length: 10
});
