import { addCharms } from 'lib/charms/addCharms';
import { getLeaderBoard } from 'lib/charms/getLeaderboard';
import { getUserOrSpaceWallet } from 'lib/charms/getUserOrSpaceWallet';
import { generateUserAndSpace } from 'testing/setupDatabase';

async function createMockUsersWithBalance(number = 20) {
  const arr = Array.from({ length: number }).fill(true);

  for (const _ of arr) {
    const { user } = await generateUserAndSpace({ isAdmin: true });
    await getUserOrSpaceWallet({ userId: user.id });
    await addCharms({ recipient: { userId: user.id }, amount: 100 });
  }
}

describe('getLeaderBoard', () => {
  it('should get top charm leaders board', async () => {
    const { user: user1 } = await generateUserAndSpace({ isAdmin: true });
    await getUserOrSpaceWallet({ userId: user1.id });
    await addCharms({ recipient: { userId: user1.id }, amount: 300 });

    // generate more users than leader board size
    await createMockUsersWithBalance(25);

    const { user: user2 } = await generateUserAndSpace({ isAdmin: true });
    await getUserOrSpaceWallet({ userId: user2.id });
    await addCharms({ recipient: { userId: user2.id }, amount: 200 });

    const { user: user3 } = await generateUserAndSpace({ isAdmin: true });
    await getUserOrSpaceWallet({ userId: user3.id });
    await addCharms({ recipient: { userId: user3.id }, amount: 210 });

    const { user: user4 } = await generateUserAndSpace({ isAdmin: true });
    await getUserOrSpaceWallet({ userId: user4.id });
    await addCharms({ recipient: { userId: user4.id }, amount: 300 });

    const leaderBoard = await getLeaderBoard();

    expect(leaderBoard).toHaveLength(20);
    // sort first by totalBalance, then by createdAt
    expect(leaderBoard[0]?.user?.id).toBe(user1.id);
    expect(leaderBoard[1]?.user?.id).toBe(user4.id);
    expect(leaderBoard[2]?.user?.id).toBe(user3.id);
    expect(leaderBoard[3]?.user?.id).toBe(user2.id);
  });
});
