import type { SelectOptionType } from '@root/lib/proposals/forms/interfaces';

import charmClient from 'charmClient';
import type { PropertyValueWithDetails } from 'lib/members/interfaces';

export function useMutateMemberPropertyValues(onUpdate: VoidFunction) {
  async function updateAndMutatePropertyOptions(propUpdate: {
    id: string;
    options: SelectOptionType[];
    spaceId: string;
  }) {
    await charmClient.members.updateMemberProperty(propUpdate.spaceId, propUpdate);

    onUpdate();
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
