import { useCallback } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import { MEMBER_PROPERTY_CONFIG } from 'lib/members/constants';
import type { UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

export function useMemberPropertyValues (memberId: string) {
  const { user } = useUser();
  const { data: memberPropertyValues, mutate } = useSWR(`members/${memberId}/values`, () => charmClient.members.getPropertyValues(memberId));

  const getValuesForSpace = useCallback((spaceId: string) => {
    return memberPropertyValues?.find(sv => sv.spaceId === spaceId);
  }, [memberPropertyValues]);

  const canEditSpaceProfile = useCallback((spaceId: string) => {
    if (!user) {
      return false;
    }

    const isAdmin = user.spaceRoles.find(sr => sr.spaceId === spaceId)?.isAdmin || false;
    const spaceProps = getValuesForSpace(spaceId)?.properties || [];
    const hasEditableProps = spaceProps.some(prop => prop.type === 'name' || !MEMBER_PROPERTY_CONFIG[prop.type]?.default);

    return hasEditableProps && (isAdmin || memberId === user.id);
  }, [user, memberPropertyValues]);

  const updateSpaceValues = useCallback(async (spaceId: string, values: UpdateMemberPropertyValuePayload[]) => {
    const updatedValues = await charmClient.members.updateSpacePropertyValues(memberId, spaceId, values);

    mutate(state => {
      if (!state) {
        return;
      }

      const updatedState = [...state];

      return updatedState.map((sv) => {
        if (sv.spaceId === spaceId) {
          const updatedProperties = [...sv.properties];
          updatedValues.forEach(uv => {
            const valueIndex = updatedProperties.findIndex(v => v.memberPropertyId === uv.memberPropertyId);
            if (valueIndex > -1) {
              updatedProperties[valueIndex].value = uv.value;
            }
            else {
              updatedProperties.push(uv);
            }
          });

          return { ...sv, properties: updatedProperties };
        }

        return sv;
      });
    }, { revalidate: false });
  }, [mutate]);

  return {
    getValuesForSpace,
    memberPropertyValues,
    updateSpaceValues,
    isLoading: !memberPropertyValues,
    canEditSpaceProfile
  };
}
