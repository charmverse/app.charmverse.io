// get the first userId based on user identity
export function findUserByIdentity(user: { walletAddress?: string; email?: string; discordHandle?: string }) {
  if (user.walletAddress) {
    return user.walletAddress;
  }
  if (user.email) {
    return user.email;
  }
  if (user.discordHandle) {
    return user.discordHandle;
  }
  return '';
}
