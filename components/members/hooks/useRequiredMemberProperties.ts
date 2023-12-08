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
import { NON_DEFAULT_MEMBER_PROPERTIES } from 'lib/members/constants';
import type { MemberPropertyValueType, Social, UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

import { useMemberPropertyValues } from './useMemberPropertyValues';

const requiredString = yup.string().required().ensure().trim();

const nonRequiredString = yup.string().notRequired().trim();

const TWITTER_URL_REGEX = /^$|^http(?:s)?:\/\/(?:www\.)?(?:mobile\.)?twitter\.com\/([a-zA-Z0-9_]+)/i;
const GITHUB_URL_REGEX = /^$|^http(?:s)?:\/\/(?:www\.)?github\.([a-z])+\/([^\s\\]{1,})+\/?$/i;
const LINKEDIN_URL_REGEX =
  /^$|^http(?:s)?:\/\/((www|\w\w)\.)?linkedin.com\/((in\/[^/]+\/?)|(company\/[^/]+\/?)|(pub\/[^/]+\/((\w|\d)+\/?){3}))$/i;

export function useRequiredMemberProperties({ userId }: { userId: string }) {
  const { memberPropertyValues } = useMemberPropertyValues(userId);
  const { space: currentSpace } = useCurrentSpace();
  const { data: userDetails } = useSWRImmutable(`/current-user-details`, () => charmClient.getUserDetails());

  const {
    memberProperties,
    isBioRequired,
    isTimezoneRequired,
    requiredProperties,
    nonEmptyRequiredProperties,
    isGithubRequired,
    isLinkedinRequired,
    isTwitterRequired
  } = useMemo(() => {
    const _memberProperties = memberPropertyValues
      ?.filter((mpv) => mpv.spaceId === currentSpace?.id)
      .map((mpv) => mpv.properties)
      .flat();

    // Role and join date are non editable properties
    const _requiredProperties =
      _memberProperties?.filter(
        (p) => p.required && !['role', 'join_date', 'discord', 'profile_pic'].includes(p.type)
      ) ?? [];
    const _isTimezoneRequired = _requiredProperties.find((p) => p.type === 'timezone');
    const _isBioRequired = _requiredProperties.find((p) => p.type === 'bio');
    const _isTwitterRequired = _requiredProperties.find((p) => p.type === 'twitter');
    const _isLinkedinRequired = _requiredProperties.find((p) => p.type === 'linked_in');
    const _isGithubRequired = _requiredProperties.find((p) => p.type === 'github');

    const userDetailsSocial = userDetails?.social as Social;

    const propertiesWithoutValue = _requiredProperties
      .filter(
        (rp) =>
          !_memberProperties?.find((mp) => mp.memberPropertyId === rp.memberPropertyId)?.value &&
          !['bio', 'timezone', 'twitter', 'linked_in', 'github'].includes(rp.type)
      )
      .map((p) => p.memberPropertyId);

    if (userDetails && _isTimezoneRequired && !userDetails.timezone) {
      propertiesWithoutValue.push('timezone');
    }

    if (userDetails && _isBioRequired && !userDetails.description) {
      propertiesWithoutValue.push('bio');
    }

    if (userDetails && _isTwitterRequired && !userDetailsSocial?.twitterURL) {
      propertiesWithoutValue.push('twitter');
    }

    if (userDetails && _isLinkedinRequired && !userDetailsSocial?.linkedinURL) {
      propertiesWithoutValue.push('linked_in');
    }

    if (userDetails && _isGithubRequired && !userDetailsSocial?.githubURL) {
      propertiesWithoutValue.push('github');
    }

    return {
      memberProperties: _memberProperties,
      requiredProperties: _requiredProperties,
      isTimezoneRequired: !!_isTimezoneRequired,
      isBioRequired: !!_isBioRequired,
      nonEmptyRequiredProperties: propertiesWithoutValue.length !== 0,
      isTwitterRequired: !!_isTwitterRequired,
      isLinkedinRequired: !!_isLinkedinRequired,
      isGithubRequired: !!_isGithubRequired
    };
  }, [userDetails, memberPropertyValues, currentSpace?.id]);

  return {
    memberProperties,
    requiredProperties,
    isTimezoneRequired,
    isBioRequired,
    nonEmptyRequiredProperties,
    userDetails,
    isTwitterRequired,
    isLinkedinRequired,
    isGithubRequired
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
    isValid,
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
    description: getValues('description'),
    social: getValues('social'),
    timezone: getValues('timezone')
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
    isValid,
    isDirty,
    errors,
    onFormChange,
    isSubmitting,
    onSubmit
  };
}
