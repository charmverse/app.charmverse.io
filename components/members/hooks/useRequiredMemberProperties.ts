import type { UserDetails } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { useFormFieldsWithState } from 'components/common/form/hooks/useFormFields';
import type { EditableFields } from 'components/settings/profile/components/UserDetailsForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { DEFAULT_MEMBER_PROPERTIES, NON_DEFAULT_MEMBER_PROPERTIES } from 'lib/members/constants';
import type { Social } from 'lib/members/interfaces';

import { useMemberPropertyValues } from './useMemberPropertyValues';

const requiredString = (msg: string) => yup.string().required(msg).ensure().trim();

const nonRequiredString = yup.string().notRequired().trim();

export const TWITTER_URL_REGEX = /^$|^http(?:s)?:\/\/(?:www\.)?(?:mobile\.)?\b(x|twitter)\.com\/([a-zA-Z0-9_]+)/i;
export const GITHUB_URL_REGEX = /^$|^http(?:s)?:\/\/(?:www\.)?github\.([a-z])+\/([^\s\\]{1,})+\/?$/i;
export const LINKEDIN_URL_REGEX =
  /^$|^http(?:s)?:\/\/((www|\w\w)\.)?linkedin.com\/((in\/[^/]+\/?)|(company\/[^/]+\/?)|(pub\/[^/]+\/((\w|\d)+\/?){3}))$/i;

export function useRequiredMemberProperties({ userId }: { userId: string }) {
  const { user: currentUser } = useUser();
  const { memberPropertyValues, isLoading: isLoadingMemberProperties } = useMemberPropertyValues(userId);
  const { space: currentSpace } = useCurrentSpace();
  const { data: userDetails, isLoading: isLoadingUserDetails } = useSWRImmutable(`/current-user-details`, () =>
    charmClient.getUserDetails()
  );

  const data = useMemo(() => {
    const _memberProperties = memberPropertyValues
      ?.filter((mpv) => mpv.spaceId === currentSpace?.id)
      .map((mpv) => mpv.properties)
      .flat();

    // Role and join date are non editable properties
    const _requiredProperties =
      _memberProperties?.filter((p) => p.required && !['role', 'join_date', 'profile_pic'].includes(p.type)) ?? [];

    const _isTimezoneRequired = _requiredProperties.find((p) => p.type === 'timezone');
    const _isBioRequired = _requiredProperties.find((p) => p.type === 'bio');
    const _isTwitterRequired = _requiredProperties.find((p) => p.type === 'twitter');
    const _isLinkedinRequired = _requiredProperties.find((p) => p.type === 'linked_in');
    const _isGithubRequired = _requiredProperties.find((p) => p.type === 'github');
    const _isGoogleRequired =
      _requiredProperties.find((p) => p.type === 'google') || currentSpace?.primaryMemberIdentity === 'Google';
    const _isDiscordRequired =
      _requiredProperties.find((p) => p.type === 'discord') || currentSpace?.primaryMemberIdentity === 'Discord';
    const _isWalletRequired =
      _requiredProperties.find((p) => p.type === 'wallet') || currentSpace?.primaryMemberIdentity === 'Wallet';
    const _isTelegramRequired =
      _requiredProperties.find((p) => p.type === 'telegram') || currentSpace?.primaryMemberIdentity === 'Telegram';
    const _isFarcasterRequired =
      _requiredProperties.find((p) => p.type === 'farcaster') || currentSpace?.primaryMemberIdentity === 'Farcaster';

    const userDetailsSocial = userDetails?.social as Social;

    const requiredPropertiesWithoutValue = _requiredProperties
      .filter(
        (rp) =>
          !_memberProperties?.find((mp) => mp.memberPropertyId === rp.memberPropertyId)?.value &&
          !DEFAULT_MEMBER_PROPERTIES.includes(rp.type)
      )
      .map((p) => p.memberPropertyId);

    if (userDetails && _isTimezoneRequired && !userDetails.timezone) {
      requiredPropertiesWithoutValue.push('timezone');
    }

    if (userDetails && _isBioRequired && !userDetails.description) {
      requiredPropertiesWithoutValue.push('bio');
    }

    if (_isTwitterRequired && !userDetailsSocial?.twitterURL) {
      requiredPropertiesWithoutValue.push('twitter');
    }

    if (_isLinkedinRequired && !userDetailsSocial?.linkedinURL) {
      requiredPropertiesWithoutValue.push('linked_in');
    }

    if (_isGithubRequired && !userDetailsSocial?.githubURL) {
      requiredPropertiesWithoutValue.push('github');
    }

    if (currentUser) {
      if (_isWalletRequired && (currentUser.wallets ?? []).length === 0) {
        requiredPropertiesWithoutValue.push('wallet');
      }

      if (_isGoogleRequired && (currentUser.googleAccounts ?? []).length === 0) {
        requiredPropertiesWithoutValue.push('google');
      }

      if (_isDiscordRequired && !currentUser.discordUser) {
        requiredPropertiesWithoutValue.push('discord');
      }

      if (_isTelegramRequired && !currentUser.telegramUser) {
        requiredPropertiesWithoutValue.push('telegram');
      }

      if (_isFarcasterRequired && !currentUser.farcasterUser) {
        requiredPropertiesWithoutValue.push('farcaster');
      }
    }

    return {
      memberProperties: _memberProperties,
      requiredProperties: _requiredProperties,
      isTimezoneRequired: !!_isTimezoneRequired,
      isBioRequired: !!_isBioRequired,
      requiredPropertiesWithoutValue,
      hasEmptyRequiredProperties: requiredPropertiesWithoutValue.length !== 0,
      isTwitterRequired: !!_isTwitterRequired,
      isLinkedinRequired: !!_isLinkedinRequired,
      isGithubRequired: !!_isGithubRequired,
      isGoogleRequired: !!_isGoogleRequired,
      isDiscordRequired: !!_isDiscordRequired,
      isWalletRequired: !!_isWalletRequired,
      isTelegramRequired: !!_isTelegramRequired,
      isFarcasterRequired: !!_isFarcasterRequired
    };
  }, [userDetails, memberPropertyValues, currentSpace?.id, currentUser]);

  return {
    ...data,
    isLoadingMemberProperties,
    isLoadingUserDetails,
    userDetails
  };
}

export function useRequiredMemberPropertiesForm({ userId }: { userId: string }) {
  const { memberProperties = [] } = useRequiredMemberProperties({ userId });
  const { updateSpaceValues, refreshPropertyValues } = useMemberPropertyValues(userId);
  const { space } = useCurrentSpace();
  const { mutateMembers } = useMembers();

  const nonDefaultMemberProperties = useMemo(() => {
    return memberProperties
      .filter((p) => NON_DEFAULT_MEMBER_PROPERTIES.includes(p.type))
      .map((p) => ({
        ...p,
        id: p.memberPropertyId
      }));
  }, [memberProperties]);

  const {
    control,
    formState: { isDirty, isValid },
    onFormChange,
    onSubmit
  } = useFormFieldsWithState({
    fields: nonDefaultMemberProperties,
    onSubmit: async (_values) => {
      if (space) {
        await updateSpaceValues(
          space.id,
          Object.entries(_values).map(([memberPropertyId, value]) => ({ memberPropertyId, value }))
        );
        refreshPropertyValues();
        mutateMembers();
      }
    }
  });

  return {
    control,
    isValid,
    isDirty,
    onSubmit,
    onFormChange
  };
}

export function useRequiredUserDetailsForm({ userId }: { userId: string }) {
  const {
    isBioRequired,
    isGithubRequired,
    isLinkedinRequired,
    isTimezoneRequired,
    isTwitterRequired,
    userDetails: { id, ...userDetails } = {} as UserDetails
  } = useRequiredMemberProperties({ userId });
  const { showMessage } = useSnackbar();
  const { mutateMembers } = useMembers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    formState: { errors, isValid, isDirty },
    setValue,
    handleSubmit,
    getValues,
    reset,
    watch
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      ...userDetails,
      social: userDetails.social ?? {
        twitterURL: '',
        githubURL: '',
        linkedinURL: ''
      }
    },
    resolver: yupResolver(
      yup.object({
        description: isBioRequired ? requiredString('Bio is required') : nonRequiredString,
        timezone: isTimezoneRequired ? requiredString('Timezone is required') : nonRequiredString,
        social: yup.object({
          twitterURL: isTwitterRequired
            ? requiredString('Twitter is required').matches(TWITTER_URL_REGEX, 'Invalid Twitter link')
            : nonRequiredString.matches(TWITTER_URL_REGEX, 'Invalid Twitter link'),
          githubURL: isGithubRequired
            ? requiredString('Github is required').matches(GITHUB_URL_REGEX, 'Invalid GitHub link')
            : nonRequiredString.matches(GITHUB_URL_REGEX, 'Invalid GitHub link'),
          linkedinURL: isLinkedinRequired
            ? requiredString('Linkedin is required').matches(LINKEDIN_URL_REGEX, 'Invalid LinkedIn link')
            : nonRequiredString.matches(LINKEDIN_URL_REGEX, 'Invalid LinkedIn link')
        })
      })
    )
  });

  function onFormChange(fields: EditableFields) {
    Object.entries(fields).forEach(([key, value]) => {
      setValue(key as keyof EditableFields, value, {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true
      });
    });
  }

  const values = watch();

  function onSubmit() {
    if (isDirty && isValid) {
      setIsSubmitting(true);
      return handleSubmit(async (_values) => {
        try {
          await charmClient.updateUserDetails(getValues());
          await Promise.all([mutate('/current-user-details'), mutateMembers()]);
          reset(_values, {
            keepDirty: false,
            keepDirtyValues: false
          });
          showMessage('Profile updated', 'success');
        } finally {
          setIsSubmitting(false);
        }
      })();
    }
  }

  return {
    values,
    isValid,
    isDirty,
    errors,
    onFormChange,
    isSubmitting,
    onSubmit
  };
}
