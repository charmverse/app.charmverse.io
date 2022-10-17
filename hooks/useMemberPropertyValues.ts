import { useCallback } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

export function useMemberPropertyValues (memberId: string) {
  const { data: memberPropertyValues, mutate } = useSWR(`members/${memberId}/values`, () => charmClient.members.getPropertyValues(memberId));

  const getValuesForSpace = useCallback((spaceId: string) => {
    return memberPropertyValues?.find(sv => sv.spaceId === spaceId);
  }, [memberPropertyValues]);

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
              updatedProperties[valueIndex].value = uv;
            }
            else {
              updatedProperties.push(uv);
            }
          });

          return { spaceId, properties: updatedProperties };
        }

        return sv;
      });
    }, { revalidate: false });
  }, [mutate]);

  return {
    getValuesForSpace,
    memberPropertyValues,
    updateSpaceValues,
    isLoading: !memberPropertyValues
  };
}
