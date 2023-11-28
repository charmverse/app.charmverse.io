import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { MemberPropertyValueType } from 'lib/members/interfaces';

import { useMemberPropertyValues } from './useMemberPropertyValues';

export function useMemberPropertyRequired({ userId }: { userId: string }) {
  const { memberPropertyValues = [] } = useMemberPropertyValues(userId);
  const { space: currentSpace } = useCurrentSpace();

  const memberProperties = useMemo(
    () =>
      memberPropertyValues
        .filter((mpv) => mpv.spaceId === currentSpace?.id)
        .map((mpv) => mpv.properties)
        .flat(),
    [memberPropertyValues, currentSpace?.id]
  );

  const requiredProperties =
    memberProperties.filter(
      (p) =>
        p.required &&
        // Handled by oauth
        !['linked_in', 'github', 'discord', 'twitter', 'role', 'profile_pic', 'join_date'].includes(p.type)
    ) ?? [];

  const {
    control,
    formState: { isValid, errors },
    reset,
    getValues
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(
      yup.object(
        Object.values(requiredProperties).reduce((acc, prop) => {
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
    memberProperties
  };
}
