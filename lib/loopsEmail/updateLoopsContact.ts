import { isEnabled, findContact, updateContact } from './client';

export async function updateLoopsContact({ email, subscribed }: { email: string; subscribed: boolean }) {
  if (!isEnabled) {
    return { success: false };
  }
  const [contact] = await findContact({ email });
  if (contact) {
    return updateContact({
      userId: contact.id,
      email,
      subscribed
    });
  }
}
