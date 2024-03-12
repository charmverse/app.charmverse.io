import type { FormField } from '@charmverse/core/prisma-client';

export function getProposalFormFields(fields: FormField[] | null | undefined, canViewPrivateFields: boolean) {
  if (!fields) {
    return null;
  }

  return canViewPrivateFields ? fields : fields.filter((field) => !field.private);
}
