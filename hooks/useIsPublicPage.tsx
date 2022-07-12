import { useRouter } from 'next/router';
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

type Context = boolean;

const IsPublicContext = createContext<Context>(false);

export function IsPublicPageProvider ({ children }: {children: ReactNode}) {

  const router = useRouter();

  const isPublic = useMemo(() => {
    return router.route.split('/')[1] === 'share';
  }, [router.route]);

  return (
    <IsPublicContext.Provider value={isPublic}>
      {children}
    </IsPublicContext.Provider>
  );
}

export const useIsPublicPage = () => useContext(IsPublicContext);
