import { gql, ApolloClient, InMemoryCache, from, HttpLink, ApolloLink, fromPromise, toPromise } from '@apollo/client';
import type { InputMaybe, ProfileFragment, Scalars } from '@lens-protocol/client';
import type { CreatePublicPostRequest } from '@lens-protocol/sdk-gated/dist/graphql/types';
import useSWR from 'swr';
import { v4 as uuid } from 'uuid';

import { POST } from 'adapters/http';
import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';

const API_URL = 'https://api-mumbai.lens.dev/';

const httpLink = new HttpLink({
  uri: API_URL,
  fetchOptions: 'no-cors',
  fetch
});

export enum CollectModules {
  AaveFeeCollectModule = 'AaveFeeCollectModule',
  Erc4626FeeCollectModule = 'ERC4626FeeCollectModule',
  FeeCollectModule = 'FeeCollectModule',
  FreeCollectModule = 'FreeCollectModule',
  LimitedFeeCollectModule = 'LimitedFeeCollectModule',
  LimitedTimedFeeCollectModule = 'LimitedTimedFeeCollectModule',
  MultirecipientFeeCollectModule = 'MultirecipientFeeCollectModule',
  RevertCollectModule = 'RevertCollectModule',
  SimpleCollectModule = 'SimpleCollectModule',
  TimedFeeCollectModule = 'TimedFeeCollectModule',
  UnknownCollectModule = 'UnknownCollectModule'
}

const LocalStorage = {
  AccessToken: 'lens.accessToken',
  RefreshToken: 'lens.refreshToken'
};

const decoded = (str: string): string => Buffer.from(str, 'base64').toString('binary');

const parseJwt = (
  token: string
): {
  id: string;
  role: string;
  iat: number;
  exp: number;
} => {
  try {
    return JSON.parse(decoded(token.split('.')[1]));
  } catch {
    return {
      id: '',
      role: '',
      iat: 0,
      exp: 0
    };
  }
};

const REFRESH_AUTHENTICATION_MUTATION = `
  mutation Refresh($request: RefreshRequest!) {
    refresh(request: $request) {
      accessToken
      refreshToken
    }
  }
`;

const authLink = new ApolloLink((operation, forward) => {
  const accessToken = localStorage.getItem(LocalStorage.AccessToken);
  const refreshToken = localStorage.getItem(LocalStorage.RefreshToken);

  if (!accessToken || accessToken === 'undefined') {
    return forward(operation);
  }

  const expiringSoon = Date.now() >= (parseJwt(accessToken)?.exp ?? 0) * 1000;

  if (!expiringSoon) {
    operation.setContext({
      headers: {
        'x-access-token': accessToken ? `Bearer ${accessToken}` : ''
      }
    });

    return forward(operation);
  }

  return fromPromise(
    POST<{ data: { refresh: { accessToken: string; refreshToken: string } } }>(
      API_URL,
      {
        operationName: 'Refresh',
        query: REFRESH_AUTHENTICATION_MUTATION,
        variables: { request: { refreshToken } }
      },
      { headers: { 'Content-Type': 'application/json' }, credentials: 'omit' }
    )
      .then(({ data }) => {
        const _accessToken = data?.refresh?.accessToken;
        const _refreshToken = data?.refresh?.refreshToken;
        operation.setContext({
          headers: { 'x-access-token': `Bearer ${_accessToken}` }
        });

        localStorage.setItem(LocalStorage.AccessToken, _accessToken);
        localStorage.setItem(LocalStorage.RefreshToken, _refreshToken);

        return toPromise(forward(operation));
      })
      .catch(() => {
        return toPromise(forward(operation));
      })
  );
});

const lensGraphqlClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache({})
});

export type CollectModuleType = {
  type?: CollectModules;
  amount?: { currency: string | null; value: string | null } | null;
  referralFee?: number | null;
  collectLimit?: string | null;
  timeLimit?: boolean;
  recipients?: any[];
  followerOnlyCollect?: boolean;
};

const INITIAL_COLLECT_MODULE: CollectModuleType = {
  type: CollectModules.RevertCollectModule,
  amount: null,
  referralFee: 0,
  collectLimit: null,
  timeLimit: false,
  recipients: [],
  followerOnlyCollect: false
};

const collectModuleParams = (collectModule: CollectModuleType): { revertCollectModule: true } => {
  switch (collectModule.type) {
    default:
      return { revertCollectModule: true };
  }
};

/** The publication metadata display types */
export enum PublicationMetadataDisplayTypes {
  Date = 'date',
  Number = 'number',
  String = 'string'
}

/** The metadata attribute input */
export type PublicationMetadataMediaInput = {
  /** The alt tags for accessibility */
  altTag?: InputMaybe<Scalars['String']>;
  /** The cover for any video or audio you attached */
  cover?: InputMaybe<Scalars['Url']>;
  item: Scalars['Url'];
  source?: 'LENS';
  /** This is the mime type of media */
  type?: InputMaybe<Scalars['MimeType']>;
};

export type MetadataAttributeInput = {
  /** The display type */
  displayType?: InputMaybe<PublicationMetadataDisplayTypes>;
  /** The trait type - can be anything its the name it will render so include spaces */
  traitType: Scalars['String'];
  /** The value */
  value: Scalars['String'];
};

export type PublicationMetadataV2Input = {
  animation_url?: InputMaybe<Scalars['Url']>;
  appId?: InputMaybe<Scalars['Sources']>;
  attributes: MetadataAttributeInput[];
  /** The content of a publication. If this is blank `media` must be defined or its out of spec */
  content?: InputMaybe<Scalars['Markdown']>;

  /** A human-readable description of the item. */
  description?: InputMaybe<Scalars['Markdown']>;
  external_url?: InputMaybe<Scalars['Url']>;
  /** legacy to support OpenSea will store any NFT image here. */
  image?: InputMaybe<Scalars['Url']>;
  /** This is the mime type of the image. This is used if your uploading more advanced cover images as sometimes ipfs does not emit the content header so this solves that */
  imageMimeType?: InputMaybe<Scalars['MimeType']>;
  /** IOS 639-1 language code aka en or it and ISO 3166-1 alpha-2 region code aka US or IT aka en-US or it-IT */
  locale: Scalars['Locale'];
  /** Main content focus that for this publication */
  mainContentFocus: 'TEXT_ONLY';
  /** The metadata id can be anything but if your uploading to ipfs you will want it to be random.. using uuid could be an option! */
  metadata_id: Scalars['String'];
  /** Name of the item. */
  name: Scalars['String'];
  /** Ability to tag your publication */
  tags?: InputMaybe<Scalars['String'][]>;
  /** The metadata version. (1.0.0 | 2.0.0) */
  version: Scalars['String'];

  media: PublicationMetadataMediaInput[];
};

const uploadToArweave = async (data: any): Promise<string> => {
  const response = (await POST('https://metadata.lenster.xyz', data, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit'
  })) as string;
  // Lenster response header content type is text/plain;charset=UTF-8, so we need to json parse it manually
  const { id } = JSON.parse(response);
  return id;
};

const getUserLocale = () => {
  return navigator?.languages?.length ? navigator.languages[0] : navigator.language;
};

const createPostTypedData = (variables: any) => {
  return lensGraphqlClient.mutate({
    variables,
    mutation: gql`
      mutation CreatePostTypedData($options: TypedDataOptions, $request: CreatePublicPostRequest!) {
        createPostTypedData(options: $options, request: $request) {
          id
          expiresAt
          typedData {
            types {
              PostWithSig {
                name
                type
              }
            }
            domain {
              name
              chainId
              version
              verifyingContract
            }
            value {
              nonce
              deadline
              profileId
              contentURI
              collectModule
              collectModuleInitData
              referenceModule
              referenceModuleInitData
            }
          }
        }
      }
    `
  });
};

const createDataAvailabilityPostTypedData = (variables: any) => {
  return lensGraphqlClient.mutate({
    variables,
    mutation: gql`
      mutation CreateDataAvailabilityPostTypedData($request: CreateDataAvailabilityPostRequest!) {
        createDataAvailabilityPostTypedData(request: $request) {
          id
          expiresAt
          typedData {
            types {
              PostWithSig {
                name
                type
              }
            }
            domain {
              name
              chainId
              version
              verifyingContract
            }
            value {
              nonce
              deadline
              profileId
              contentURI
              collectModule
              collectModuleInitData
              referenceModule
              referenceModuleInitData
            }
          }
        }
      }
    `
  });
};

const createPostViaDispatcher = (variables: any) => {
  return lensGraphqlClient.mutate({
    variables,
    mutation: gql`
      fragment RelayerResultFields on RelayResult {
        ... on RelayerResult {
          txHash
          txId
        }
        ... on RelayError {
          reason
        }
      }
      mutation CreatePostViaDispatcher($request: CreatePublicPostRequest!) {
        createPostViaDispatcher(request: $request) {
          ...RelayerResultFields
        }
      }
    `
  });
};

const createDataAvailabilityPostViaDispatcher = (variables: any) => {
  return lensGraphqlClient.mutate({
    variables,
    mutation: gql`
      mutation CreateDataAvailabilityPostViaDispatcher($request: CreateDataAvailabilityPostRequest!) {
        createDataAvailabilityPostViaDispatcher(request: $request) {
          ... on CreateDataAvailabilityPublicationResult {
            id
            proofs
          }
          ... on RelayError {
            reason
          }
        }
      }
    `
  });
};

const restricted = false;

export function useNewLensPublication() {
  const { user } = useUser();
  const { data: lensProfile } = useSWR(user ? `public/profile/${user.id}/lens` : null, () =>
    charmClient.publicProfile.getLensProfile(user!.id)
  );

  const userSigNonce = 1;
  const collectModule = INITIAL_COLLECT_MODULE;

  // Dispatcher
  const canUseRelay = lensProfile?.dispatcher?.canUseRelay;
  const isSponsored = (lensProfile?.dispatcher as ProfileFragment['dispatcher'] & { sponsor: null | boolean })?.sponsor;

  const createViaDispatcher = async (request: any) => {
    const variables = {
      options: { overrideSigNonce: userSigNonce },
      request
    };

    const { data } = await createPostViaDispatcher({ request });
    if (data?.createPostViaDispatcher?.__typename === 'RelayError') {
      return createPostTypedData(variables);
    }
  };

  const createViaDataAvailabilityDispatcher = async (request: any) => {
    const variables = { request };

    const { data } = await createDataAvailabilityPostViaDispatcher(variables);

    if (data?.createDataAvailabilityPostViaDispatcher?.__typename === 'RelayError') {
      await createDataAvailabilityPostTypedData(variables);
    }
  };

  const isRevertCollectModule = collectModule.type === CollectModules.RevertCollectModule;
  const useDataAvailability = !restricted && isRevertCollectModule;

  const createPublication = async ({ contentText, proposalLink }: { contentText: string; proposalLink: string }) => {
    if (!lensProfile) {
      return;
    }

    const metadata: PublicationMetadataV2Input = {
      version: '2.0.0',
      metadata_id: uuid(),
      content: `${contentText} \n\n CharmVerse Proposal Link: ${proposalLink}`,
      external_url: `https://lenster.xyz/u/${lensProfile.handle}`,
      image: null,
      imageMimeType: null,
      name: `Post by @${lensProfile.handle}`,
      animation_url: null,
      mainContentFocus: 'TEXT_ONLY',
      attributes: [{ traitType: 'type', displayType: PublicationMetadataDisplayTypes.String, value: 'text_only' }],
      media: [],
      tags: [],
      locale: getUserLocale(),
      appId: 'Lenster'
    };

    const arweaveId = await uploadToArweave(metadata);

    const dataAvailabilityRequest = {
      from: lensProfile?.id,
      contentURI: `ar://${arweaveId}`
    };

    const request: CreatePublicPostRequest = {
      profileId: lensProfile.id,
      contentURI: `ar://${arweaveId}`,
      collectModule: collectModuleParams(collectModule)
    };

    if (canUseRelay) {
      if (useDataAvailability && isSponsored) {
        return createViaDataAvailabilityDispatcher(dataAvailabilityRequest);
      }

      return createViaDispatcher(request);
    }

    return createPostTypedData({
      variables: { options: { overrideSigNonce: userSigNonce }, request }
    });
  };

  return {
    createPublication
  };
}
