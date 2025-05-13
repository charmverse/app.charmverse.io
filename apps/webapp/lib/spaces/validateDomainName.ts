import { DOMAIN_BLACKLIST } from '@packages/spaces/config';
import { string } from 'yup';

export const domainSchema = string()
  .ensure()
  .trim()
  .lowercase()
  .min(3, 'Domain must be at least 3 characters')
  .matches(/^[0-9a-z-]*$/, 'Domain must be only lowercase hyphens, letters, and numbers')
  .notOneOf(DOMAIN_BLACKLIST, 'Domain is not allowed')
  .required('Domain is required');

export function validateDomainName(domain: string) {
  try {
    domainSchema.validateSync(domain);
    return { isValid: true, error: '' };
  } catch (err: any) {
    let errorMessage = 'Invalid domain name';
    if (err.errors?.length) {
      errorMessage += `. ${err.errors?.join('. ').trim()}`;
    }
    return { isValid: false, error: errorMessage };
  }
}
