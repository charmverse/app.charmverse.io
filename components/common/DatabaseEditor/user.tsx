export interface IUser {
  id: string;
  username: string;
  email: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  create_at: number;
  update_at: number;
  is_bot: boolean;
  wallet_address?: string;
}
