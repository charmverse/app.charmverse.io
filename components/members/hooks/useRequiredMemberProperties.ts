import type { UserDetails } from '@charmverse/core/dist/cjs/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
import * as yup from 'yup';

import charmClient from 'charmClient';
import type { EditableFields } from 'components/settings/profile/components/UserDetailsForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { DEFAULT_MEMBER_PROPERTIES, NON_DEFAULT_MEMBER_PROPERTIES } from 'lib/members/constants';
import type { MemberPropertyValueType, Social, UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

import { useMemberPropertyValues } from './useMemberPropertyValues';

const requiredString = yup.string().required().ensure().trim();

const nonRequiredString = yup.string().notRequired().trim();

const TWITTER_URL_REGEX = /^$|^http(?:s)?:\/\/(?:www\.)?(?:mobile\.)?twitter\.com\/([a-zA-Z0-9_]+)/i;
const GITHUB_URL_REGEX = /^$|^http(?:s)?:\/\/(?:www\.)?github\.([a-z])+\/([^\s\\]{1,})+\/?$/i;
const LINKEDIN_URL_REGEX =
  /^$|^http(?:s)?:\/\/((www|\w\w)\.)?linkedin.com\/((in\/[^/]+\/?)|(company\/[^/]+\/?)|(pub\/[^/]+\/((\w|\d)+\/?){3}))$/i;

export function useRequiredMemberProperties({ userId }: { userId: string }) {
  const { user: currentUser } = useUser();
  const { memberPropertyValues } = useMemberPropertyValues(userId);
  const { space: currentSpace } = useCurrentSpace();
  const { data: userDetails } = useSWRImmutable(`/current-user-details`, () => charmClient.getUserDetails());

  const data = useMemo(() => {
    const _memberProperties = memberPropertyValues
      ?.filter((mpv) => mpv.spaceId === currentSpace?.id)
      .map((mpv) => mpv.properties)
      .flat();

    // Role and join date are non editable properties
    const _requiredProperties =
      _memberProperties?.filter((p) => p.required && !['role', 'join_date', 'profile_pic'].includes(p.type)) ?? [];

    const nameMemberProperty = _memberProperties?.find((p) => p.type === 'name');

    const _isTimezoneRequired = _requiredProperties.find((p) => p.type === 'timezone');
    const _isBioRequired = _requiredProperties.find((p) => p.type === 'bio');
    const _isTwitterRequired = _requiredProperties.find((p) => p.type === 'twitter');
    const _isLinkedinRequired = _requiredProperties.find((p) => p.type === 'linked_in');
    const _isGithubRequired = _requiredProperties.find((p) => p.type === 'github');
    const _isGoogleRequired = _requiredProperties.find((p) => p.type === 'google');
    const _isDiscordRequired = _requiredProperties.find((p) => p.type === 'discord');
    const _isWalletRequired = _requiredProperties.find((p) => p.type === 'wallet');
    const _isTelegramRequired = _requiredProperties.find((p) => p.type === 'telegram');
    const _isNameRequired = _requiredProperties.find((p) => p.type === 'name');

    const userDetailsSocial = userDetails?.social as Social;

    const requiredPropertiesWithoutValue = _requiredProperties
      .filter(
        (rp) =>
          !_memberProperties?.find((mp) => mp.memberPropertyId === rp.memberPropertyId)?.value &&
          !DEFAULT_MEMBER_PROPERTIES.includes(rp.type)
      )
      .map((p) => p.memberPropertyId);

    if (nameMemberProperty && _isNameRequired && !nameMemberProperty.value) {
      requiredPropertiesWithoutValue.push('name');
    }

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

    if (_isWalletRequired && (currentUser?.wallets ?? []).length === 0) {
      requiredPropertiesWithoutValue.push('wallet');
    }

    if (_isGoogleRequired && (currentUser?.googleAccounts ?? []).length === 0) {
      requiredPropertiesWithoutValue.push('google');
    }

    if (_isDiscordRequired && !currentUser?.discordUser) {
      requiredPropertiesWithoutValue.push('discord');
    }

    if (_isTelegramRequired && !currentUser?.telegramUser) {
      requiredPropertiesWithoutValue.push('telegram');
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
      isTelegramRequired: !!_isTelegramRequired
    };
  }, [userDetails, memberPropertyValues, currentSpace?.id, currentUser]);

  return {
    ...data,
    userDetails
  };
}

export function useRequiredMemberPropertiesForm({ userId }: { userId: string }) {
  const { memberProperties = [] } = useRequiredMemberProperties({ userId });
  const { updateSpaceValues, refreshPropertyValues } = useMemberPropertyValues(userId);
  const { space } = useCurrentSpace();

  const {
    control,
    formState: { isValid, errors, isDirty, isSubmitting },
    reset,
    getValues,
    setValue,
    handleSubmit
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(
      yup.object(
        memberProperties.reduce((acc, property) => {
          if (!['name', ...NON_DEFAULT_MEMBER_PROPERTIES].includes(property.type)) {
            return acc;
          }

          const isRequired = property.required;

          if (isRequired) {
            if (property.type === 'multiselect') {
              acc[property.memberPropertyId] = yup.array().of(yup.string()).required();
              return acc;
            }

            acc[property.memberPropertyId] = property.type === 'number' ? yup.number().required() : requiredString;

            return acc;
          }

          if (property.type === 'multiselect') {
            acc[property.memberPropertyId] = yup.array().of(yup.string());
            return acc;
          }

          acc[property.memberPropertyId] = property.type === 'number' ? yup.number() : nonRequiredString;

          return acc;
        }, {} as Record<string, any>)
      )
    )
  });

  const values = getValues();

  useEffect(() => {
    if (!memberProperties) {
      return;
    }
    const defaultValues = memberProperties.reduce<Record<string, MemberPropertyValueType>>((acc, prop) => {
      if (['name', ...NON_DEFAULT_MEMBER_PROPERTIES].includes(prop.type)) {
        acc[prop.memberPropertyId] = prop.value;
      }
      return acc;
    }, {});

    reset(defaultValues);
  }, [memberProperties, reset]);

  const onSubmit = () => {
    if (isDirty && isValid && space) {
      return handleSubmit(async () => {
        await updateSpaceValues(
          space.id,
          Object.entries(getValues()).map(([memberPropertyId, value]) => ({ memberPropertyId, value }))
        );
        refreshPropertyValues();
      })();
    }
  };

  function onFormChange(fields: UpdateMemberPropertyValuePayload[]) {
    fields.forEach((field) => {
      setValue(field.memberPropertyId, field.value, {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true
      });
    });
  }

  return {
    values,
    control,
    isValid: Object.keys(errors).length === 0,
    errors,
    isDirty,
    setValue,
    getValues,
    isSubmitting,
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

  const {
    formState: { errors, isValid, isDirty, isSubmitting },
    watch,
    setValue,
    handleSubmit,
    getValues
  } = useForm({
    mode: 'onChange',
    defaultValues: userDetails,
    resolver: yupResolver(
      yup.object({
        description: isBioRequired ? requiredString : nonRequiredString,
        timezone: isTimezoneRequired ? requiredString : nonRequiredString,
        social: yup.object({
          twitterURL: isTwitterRequired
            ? requiredString.matches(TWITTER_URL_REGEX, 'Invalid Twitter link')
            : nonRequiredString.matches(TWITTER_URL_REGEX, 'Invalid Twitter link'),
          githubURL: isGithubRequired
            ? requiredString.matches(GITHUB_URL_REGEX, 'Invalid GitHub link')
            : nonRequiredString.matches(GITHUB_URL_REGEX, 'Invalid GitHub link'),
          linkedinURL: isLinkedinRequired
            ? requiredString.matches(LINKEDIN_URL_REGEX, 'Invalid LinkedIn link')
            : nonRequiredString.matches(LINKEDIN_URL_REGEX, 'Invalid LinkedIn link'),
          discordUsername: nonRequiredString
        })
      })
    )
  });

  const values = {
    description: watch('description'),
    social: watch('social'),
    timezone: watch('timezone')
  };

  function onFormChange(fields: EditableFields) {
    Object.entries(fields).forEach(([key, value]) => {
      setValue(key as keyof EditableFields, value, {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true
      });
    });
  }

  function onSubmit() {
    if (isDirty && isValid) {
      return handleSubmit(async () => {
        await charmClient.updateUserDetails(getValues());
        await mutate('/current-user-details');
        await mutateMembers();
        showMessage('Profile updated', 'success');
      })();
    }
  }

  return {
    values,
    isValid: Object.keys(errors).length === 0,
    isDirty,
    errors,
    onFormChange,
    isSubmitting,
    onSubmit
  };
}
