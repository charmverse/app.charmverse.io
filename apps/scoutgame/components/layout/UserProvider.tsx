'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { SessionUser } from 'lib/session/getUserFromSession';

type UserContext = {
  user: SessionUser | null;
  updateUser: (updatedUser: Partial<SessionUser>) => void;
};

export const UserContext = createContext<Readonly<UserContext | null>>(null);

export function UserProvider({ children, userSession }: { children: ReactNode; userSession: SessionUser | null }) {
  const [user, setUser] = useState<SessionUser | null>(userSession);

  const updateUser = useCallback((_updatedUser: Partial<SessionUser>) => {
    throw new Error('updateUser must be implemented first in order to use it');
  }, []);

  const value = useMemo(() => ({ user, updateUser }), [user, updateUser]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
}
