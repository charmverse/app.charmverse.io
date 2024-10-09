'use client';

import { AuthKitProvider } from '@farcaster/auth-kit';
import { authConfig } from '@packages/farcaster/config';

import { WarpcastLoginButton } from './WarpcastLoginButton';

export function WarpcastLogin() {
  return (
    <AuthKitProvider config={authConfig}>
      <WarpcastLoginButton />
    </AuthKitProvider>
  );
}
