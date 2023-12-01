import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import useSWRImmutable from 'swr/immutable';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { MemberPropertyValueType } from 'lib/members/interfaces';

import { useMemberPropertyValues } from './useMemberPropertyValues';

export function useRequiredMemberProperties({ userId }: { userId: string }) {
  const { memberPropertyValues } = useMemberPropertyValues(userId);
  const { space: currentSpace } = useCurrentSpace();
  const { data: userDetails } = useSWRImmutable(`/current-user-details`, () => charmClient.getUserDetails());

  const { memberProperties, isBioRequired, isTimezoneRequired, requiredProperties, nonEmptyRequiredProperties } =
    useMemo(() => {
      const _memberProperties = memberPropertyValues
        ?.filter((mpv) => mpv.spaceId === currentSpace?.id)
        .map((mpv) => mpv.properties)
        .flat();

      // Role and join date are non editable properties
      const _requiredProperties =
        _memberProperties?.filter((p) => p.required && !['role', 'join_date'].includes(p.type)) ?? [];
      const _isTimezoneRequired = _requiredProperties.find((p) => p.type === 'timezone');
      const _isBioRequired = _requiredProperties.find((p) => p.type === 'bio');
      const propertiesWithoutValue = _requiredProperties
        .filter(
          (rp) =>
            !_memberProperties?.find((mp) => mp.memberPropertyId === rp.memberPropertyId)?.value &&
            !['bio', 'timezone'].includes(rp.type)
        )
        .map((p) => p.memberPropertyId);

      if (userDetails && _isTimezoneRequired && !userDetails.timezone) {
        propertiesWithoutValue.push('timezone');
      }

      if (userDetails && _isBioRequired && !userDetails.description) {
        propertiesWithoutValue.push('bio');
      }

      return {
        memberProperties: _memberProperties,
        requiredProperties: _requiredProperties,
        isTimezoneRequired: !!_isTimezoneRequired,
        isBioRequired: !!_isBioRequired,
        nonEmptyRequiredProperties: propertiesWithoutValue.length !== 0
      };
    }, [userDetails, memberPropertyValues, currentSpace?.id]);

  return {
    memberProperties,
    requiredProperties,
    isTimezoneRequired,
    isBioRequired,
    nonEmptyRequiredProperties,
    userDetails
  };
}

export function useRequiredMemberPropertiesForm({ userId }: { userId: string }) {
  const { memberProperties, requiredProperties, ...rest } = useRequiredMemberProperties({ userId });

  const editableRequiredProperties = requiredProperties.filter(
    (p) =>
      ![
        // Handled by oauth
        'linked_in',
        'github',
        'discord',
        'twitter',
        'profile_pic',
        // Handled separately from space member properties
        'bio',
        'timezone'
      ].includes(p.type)
  );

  const {
    control,
    formState: { isValid, errors },
    reset,
    getValues
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(
      yup.object(
        Object.values(editableRequiredProperties).reduce((acc, prop) => {
          if (prop.type === 'multiselect') {
            acc[prop.memberPropertyId] = yup.array().of(yup.string()).required();
            return acc;
          }
          acc[prop.memberPropertyId] = prop.type === 'number' ? yup.number().required() : yup.string().required();
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
      acc[prop.memberPropertyId] = prop.value;
      return acc;
    }, {});

    reset(defaultValues);
  }, [memberProperties, reset]);

  return {
    values,
    control,
    isValid,
    errors,
    memberProperties,
    requiredProperties,
    ...rest
  };
}
