import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import * as http from 'adapters/http';
import charmClient from 'charmClient';

export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar?: string
  verified?: boolean
}

type IContext = {
  discordUser: DiscordUser | null
  setDiscordUser: Dispatch<SetStateAction<DiscordUser | null>>
}

export const DiscordUserContext = createContext<Readonly<IContext>>({
  discordUser: null,
  setDiscordUser: () => null
});

export function DiscordUserProvider ({ children }: {children: ReactNode}) {
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);

  useEffect(() => {
    async function getCurrentDiscordUser () {
      const fetchedDiscordUser = await charmClient.getDiscordUser();
      console.log(fetchedDiscordUser);
      setDiscordUser(fetchedDiscordUser);
    }

    getCurrentDiscordUser();
  }, []);

  const value: IContext = useMemo(() => ({
    discordUser,
    setDiscordUser
  }), [discordUser]);

  return (
    <DiscordUserContext.Provider value={value}>
      {children}
    </DiscordUserContext.Provider>
  );
}

export const useDiscordUser = () => useContext(DiscordUserContext);
