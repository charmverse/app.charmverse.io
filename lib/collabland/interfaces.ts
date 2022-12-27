export type CollablandUserResult = {
  roles: string[];
  id: string;
  is_pending: boolean;
  pending: boolean;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
};
