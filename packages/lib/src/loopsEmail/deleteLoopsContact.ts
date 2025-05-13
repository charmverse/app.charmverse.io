import { isEnabled, deleteContact } from './client';

export async function deleteLoopsContact({ email }: { email: string }) {
  if (!isEnabled) {
    return { success: false };
  }
  return deleteContact({ email });
}
