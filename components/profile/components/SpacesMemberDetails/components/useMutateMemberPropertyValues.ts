import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { PropertyValueWithDetails } from 'lib/members/interfaces';

export function useMutateMemberPropertyValues(mutatePropertyValue: KeyedMutator<PropertyValueWithDetails[]>) {
  async function updateAndMutatePropertyOptions(propUpdate: {
    id: string;
    options: SelectOptionType[];
    spaceId: string;
  }) {
    const updatedProperty = await charmClient.members.updateMemberProperty(propUpdate.spaceId, propUpdate);

    mutatePropertyValue(
      (values) => {
        if (values) {
          return values.map((value) => {
            if (value.memberPropertyId === propUpdate.id) {
              return { ...value, options: updatedProperty.options as SelectOptionType[] };
            }

            return value;
          });
        }
      },
      { revalidate: false }
    );
  }

  async function createOption(property: PropertyValueWithDetails, option: SelectOptionType) {
    delete option.temp;

    updateAndMutatePropertyOptions({
      id: property.memberPropertyId,
      spaceId: property.spaceId,
      options: property.options ? [...property.options, option] : [option]
    });
  }

  async function updateOption(property: PropertyValueWithDetails, option: SelectOptionType) {
    delete option.temp;

    updateAndMutatePropertyOptions({
      id: property.memberPropertyId,
      spaceId: property.spaceId,
      options: property.options ? property.options.map((o) => (o.id === option.id ? option : o)) : []
    });
  }

  async function deleteOption(property: PropertyValueWithDetails, option: SelectOptionType) {
    delete option.temp;

    updateAndMutatePropertyOptions({
      id: property.memberPropertyId,
      spaceId: property.spaceId,
      options: property.options ? property.options.filter((o) => o.id !== option.id) : []
    });
  }

  return { createOption, deleteOption, updateOption, canEditOptions: true };
}
