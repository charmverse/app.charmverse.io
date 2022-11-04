import { evalueTokenGateEligibility } from "lib/token-gates/evaluateEligibility";
import { prisma } from 'db'
import { verifyTokenGateMemberships } from "lib/token-gates/verifyTokenGateMemberships";

export const evaluateTokenGate = async () => {

  const res = await verifyTokenGateMemberships()
  console.log('🔥', res);
};

evaluateTokenGate();