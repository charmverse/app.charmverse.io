export type FarcasterUser = {
  username: string;
  fid: number;
  display_name: string;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
    };
  };
  verifications: string[];
};
