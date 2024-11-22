import type { BuilderStatus } from '@charmverse/core/prisma';
import { Box, Paper } from '@mui/material';
import type { TalentProfile } from '@packages/scoutgame/users/getUserByPath';
import type { UserStats } from '@packages/scoutgame/users/getUserStats';
import type { BuilderUserInfo } from '@packages/scoutgame/users/interfaces';
import { ProfileStats } from '@packages/scoutgame-ui/components/profile/components/ProfileStats';
import { ScoutProfile } from '@packages/scoutgame-ui/components/profile/components/ScoutProfile/ScoutProfile';
import { UserProfileForm } from '@packages/scoutgame-ui/components/profile/components/UserProfileForm';

export type ProfileTab = 'build' | 'scout' | 'scout-build';

export type UserProfileWithPoints = Omit<BuilderUserInfo, 'builderStatus'> &
  UserStats & {
    currentBalance: number;
    displayName: string;
    builderStatus: BuilderStatus | null;
    bio: string | null;
    hasMoxieProfile: boolean;
    talentProfile?: TalentProfile;
  };

export type ProfilePageProps = {
  user: UserProfileWithPoints;
};

export function ProfilePage({ user }: ProfilePageProps) {
  return (
    <Box
      sx={{
        gap: 2,
        display: 'flex',
        flexDirection: 'column',
        margin: 'auto'
      }}
      data-test='profile-page'
    >
      <Paper
        sx={{
          display: 'flex',
          p: {
            xs: 0,
            md: 2
          },
          gap: 2,
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          backgroundColor: {
            xs: 'transparent',
            md: 'background.dark'
          }
        }}
        elevation={0}
      >
        <UserProfileForm user={user} />
        <ProfileStats
          seasonPoints={user.seasonPoints}
          allTimePoints={user.allTimePoints}
          points={user.currentBalance}
        />
      </Paper>
      <ScoutProfile userId={user.id} />
    </Box>
  );
}
