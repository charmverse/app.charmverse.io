import { addToDaylight } from "lib/token-gates/daylight";
import { AccessControlCondition } from "lit-js-sdk";
import { generateTokenGate } from "testing/utils/tokenGates";
import { generateUserAndSpace } from "__e2e__/utils/mocks";

export async function addToDaylightTest() { 
  const { space, user: spaceUser } = await generateUserAndSpace();

  const tokenGate = await generateTokenGate({
    userId: spaceUser.id,
    spaceId: space.id
  });


const spaceId = space.id

  addToDaylight(spaceId, tokenGate)
  
  console.log('test fired');
}

addToDaylightTest()
