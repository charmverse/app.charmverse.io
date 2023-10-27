import type { LoopsUser, UserFields } from './client';
// utils
export function getLoopsUser(user: UserFields): Pick<LoopsUser, 'email' | 'createdAt' | 'firstName'> {
  if (!user.email) {
    throw new Error('User does not have an email');
  }
  return {
    firstName: user.username,
    email: user.email,
    createdAt: user.createdAt.toISOString()
  };
}
