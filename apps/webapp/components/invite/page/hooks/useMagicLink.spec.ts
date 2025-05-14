import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import type { Mock } from 'vitest';
import { vi } from 'vitest';

import { useFirebaseAuth } from 'hooks/useFirebaseAuth';

import { useMagicLink } from './useMagicLink';

vi.mock('hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: vi.fn()
}));

vi.mock('next/router', () => ({
  useRouter: () => ({
    replace: vi.fn()
  })
}));

vi.mock('hooks/useVerifyLoginOtp', () => ({
  useVerifyLoginOtp: () => ({
    open: vi.fn()
  })
}));

describe.skip('useMagicLink()', () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  test('initial status is undefined', () => {
    (useFirebaseAuth as Mock).mockReturnValue({});
    const { result } = renderHook(() => useMagicLink());

    expect(result.current.status).toBeUndefined();
  });

  test('should request to verify email', async () => {
    (useFirebaseAuth as Mock).mockReturnValue({
      emailForSignIn: 'matt@acme.blockchain',
      validateMagicLink: vi.fn().mockReturnValueOnce(Promise.resolve({ id: '123' }))
    });

    const { result } = renderHook(() => useMagicLink());

    expect(result.current.status).toEqual('verifying_email');
    await waitFor(() => {
      expect(result.current.status).toEqual('verified_email');
    });
  });

  test('should handle error from firebase', async () => {
    (useFirebaseAuth as Mock).mockReturnValue({
      emailForSignIn: 'matt@acme.blockchain',
      validateMagicLink: vi.fn(() => Promise.reject())
    });

    const { result } = renderHook(() => useMagicLink());

    await waitFor(() => {
      expect(result.current.status).toEqual('error');
    });
  });

  test('should request a magic link', async () => {
    (useFirebaseAuth as Mock).mockReturnValue({
      requestMagicLinkViaFirebase: vi.fn()
    });

    const { result } = renderHook(() => useMagicLink());

    act(() => {
      result.current.requestMagicLink('matt@acme.blockchain');
    });

    await waitFor(() => {
      expect(result.current.status).toEqual('requesting_link');
    });
    await waitFor(() => {
      expect(result.current.status).toEqual('sent_link');
    });
  });
});
