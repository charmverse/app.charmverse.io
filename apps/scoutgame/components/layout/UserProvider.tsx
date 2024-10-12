'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useGetUserTrigger } from 'hooks/api/session';
import type { SessionUser } from 'lib/session/getUserFromSession';

type UserContext = {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  reloadUser: () => Promise<void>;
};

export const UserContext = createContext<Readonly<UserContext | null>>(null);

export function UserProvider({ children, userSession }: { children: ReactNode; userSession: SessionUser | null }) {
  const [user, setUser] = useState<SessionUser | null>(userSession);
  const { trigger: triggerReload } = useGetUserTrigger();

  const reloadUser = useCallback(async () => {
    const updated = await triggerReload();
    setUser(updated);
  }, [triggerReload]);

  const value = useMemo(() => ({ user, reloadUser, setUser }), [user, reloadUser, setUser]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
}
