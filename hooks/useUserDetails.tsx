import { UserDetails } from '@prisma/client';
import { useEffect, useState } from 'react';
import charmClient from 'charmClient';

export function useUserDetails () {
  const [userDetails, setUserDetails] = useState<Partial<UserDetails>>({});

  useEffect(() => {
    const getUserDetails = async () => {
      const details: UserDetails = await charmClient.getUserDetails();
      setUserDetails(details);
    };

    getUserDetails();

    return () => setUserDetails({});
  }, []);

  return [userDetails, setUserDetails];
}
