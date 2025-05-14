import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';

import { useFirebaseAuth } from 'hooks/useFirebaseAuth';

import { useMagicLink } from './useMagicLink';

jest.mock('hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: jest.fn()
}));

jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: jest.fn()
  })
}));

jest.mock('hooks/useVerifyLoginOtp', () => ({
  useVerifyLoginOtp: () => ({
    open: jest.fn()
  })
}));

describe.skip('useMagicLink()', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('initial status is undefined', () => {
    (useFirebaseAuth as jest.Mock<any, any>).mockReturnValue({});
    const { result } = renderHook(() => useMagicLink());

    expect(result.current.status).toBeUndefined();
  });

  test('should request to verify email', async () => {
    (useFirebaseAuth as jest.Mock<any, any>).mockReturnValue({
      emailForSignIn: 'matt@acme.blockchain',
      validateMagicLink: jest.fn().mockReturnValueOnce(Promise.resolve({ id: '123' }))
    });

    const { result } = renderHook(() => useMagicLink());

    expect(result.current.status).toEqual('verifying_email');
    await waitFor(() => {
      expect(result.current.status).toEqual('verified_email');
    });
  });

  test('should handle error from firebase', async () => {
    (useFirebaseAuth as jest.Mock<any, any>).mockReturnValue({
      emailForSignIn: 'matt@acme.blockchain',
      validateMagicLink: jest.fn(() => Promise.reject())
    });

    const { result } = renderHook(() => useMagicLink());

    await waitFor(() => {
      expect(result.current.status).toEqual('error');
    });
  });

  test('should request a magic link', async () => {
    (useFirebaseAuth as jest.Mock<any, any>).mockReturnValue({
      requestMagicLinkViaFirebase: jest.fn()
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
