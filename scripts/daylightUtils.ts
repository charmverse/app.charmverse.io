import { deleteDaylightAbility, getAllAbilities } from 'lib/tokenGates/daylight';

/**
 * Use this script for testing Daylight abilities
 */
export async function listAbilities() {
  const { abilities } = await getAllAbilities();

  console.log('Abilities created by CharmVerse:', abilities);
  console.log('Count of abilities created by CharmVerse:', abilities?.length);
}

export async function deleteAllAbilities() {
  const { abilities } = await getAllAbilities();

  if (abilities) {
    for (const ability of abilities) {
      await deleteDaylightAbility(ability.sourceId || ability.uid);
    }
  }

  console.log('Deleted abilities created by CharmVerse:', abilities?.length);
}

// listAbilities()
deleteAllAbilities();
