import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { addCharms } from '@root/lib/charms/addCharms';
import { getLeaderBoard } from '@root/lib/charms/getLeaderBoard';
import { getUserOrSpaceWallet } from '@root/lib/charms/getUserOrSpaceWallet';

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

    const { user: user5 } = await generateUserAndSpace({ isAdmin: true });
    await getUserOrSpaceWallet({ userId: user5.id });
    await addCharms({ recipient: { userId: user5.id }, amount: 50 });

    const { user: user6 } = await generateUserAndSpace({ isAdmin: true });
    await getUserOrSpaceWallet({ userId: user6.id });
    await addCharms({ recipient: { userId: user6.id }, amount: 20 });

    const leaderBoard = await getLeaderBoard(user5.id);

    expect(leaderBoard.leaders).toHaveLength(20);
    // sort first by totalBalance, then by createdAt
    expect(leaderBoard.leaders[0]?.id).toBe(user1.id);
    expect(leaderBoard.leaders[1]?.id).toBe(user4.id);
    expect(leaderBoard.leaders[2]?.id).toBe(user3.id);
    expect(leaderBoard.leaders[3]?.id).toBe(user2.id);
    expect(leaderBoard.currentUser?.position).toEqual('30');

    const leaderBoard2 = await getLeaderBoard(user6.id);
    expect(leaderBoard2.currentUser?.position).toEqual('31');
  });
});
