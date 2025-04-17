export type TelegramAccount = {
  auth_date: number;
  first_name: string;
  hash: string;
  id: number;
  last_name: string;
  photo_url: string;
  username?: string; // sometimes this is missing
};
