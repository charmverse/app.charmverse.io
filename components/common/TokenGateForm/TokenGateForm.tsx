import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Stack } from '@mui/material';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import type { Space } from '@prisma/client';
import { useEffect, useRef, useState } from 'react';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { TokenGateContent } from 'components/common/TokenGateForm/TokenGateContent';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig } from 'lib/blockchain/interfaces';
import type { TokenGateEvaluationResult, TokenGateJoinType, TokenGateWithRoles } from 'lib/token-gates/interfaces';
import { lowerCaseEqual } from 'lib/utilities/strings';

interface Props {
  onSuccess: (values: Space) => void;
  spaceDomain: string;
  displayAccordion?: boolean;
  joinType?: TokenGateJoinType;
  // Allow the Token Gate Form to auto trigger verification when a user is detected
  autoVerify?: boolean;
}

export default function TokenGateForm({
  onSuccess,
  spaceDomain,
  displayAccordion,
  joinType = 'token_gate',
  autoVerify
}: Props) {
  const renders = useRef(0);
  renders.current += 1;
  //  console.log('Renders', renders.current);
  const { showMessage } = useSnackbar();
  const { spaces, setSpaces } = useSpaces();
  const { getStoredSignature } = useWeb3AuthSig();
  const { refreshUserWithWeb3Account, loginFromWeb3Account, user } = useUser();

  const [tokenGates, setTokenGates] = useState<TokenGateWithRoles[] | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [verifyingGates, setIsVerifyingGates] = useState(false);
  const [joiningSpace, setJoiningSpace] = useState(false);

  const [tokenGateResult, setTokenGateResult] = useState<TokenGateEvaluationResult | null>(null);
  // Token gates with those that succeedeed first

  useEffect(() => {
    if (autoVerify) {
      const signature = getStoredSignature();

      if (user && !!signature && user.wallets.some((wallet) => lowerCaseEqual(wallet.address, signature.address))) {
        evaluateEligibility(signature);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!spaceDomain || spaceDomain.length < 3) {
      setTokenGates(null);
      setTokenGateResult(null);
      setIsLoading(false);
    } else {
      setIsLoading(true);

      charmClient
        .getTokenGatesForSpace({ spaceDomain })
        .then((gates) => {
          setTokenGates(gates);
          setIsLoading(false);
        })
        .catch(() => {
          setTokenGates(null);
          setIsLoading(false);
        });
    }
  }, [spaceDomain]);

  async function evaluateEligibility(authSig: AuthSig) {
    // Reset the current state
    setTokenGateResult(null);
    setIsVerifyingGates(true);

    if (!user) {
      try {
        await loginFromWeb3Account(authSig);
      } catch {
        setIsVerifyingGates(false);
        return;
      }
    }

    charmClient
      .evalueTokenGateEligibility({
        authSig,
        spaceIdOrDomain: spaceDomain
      })
      .then((verifyResult) => {
        setTokenGateResult(verifyResult);
        if (verifyResult.canJoinSpace) {
          showMessage('Verification succeeded.', 'success');
        } else {
          showMessage('Verification failed.', 'warning');
        }
      })
      .finally(() => setIsVerifyingGates(false));
  }

  async function onSubmit() {
    setJoiningSpace(true);

    try {
      await charmClient.verifyTokenGate({
        commit: true,
        spaceId: tokenGateResult?.space.id as string,
        tokens:
          tokenGateResult?.gateTokens.map((tk) => {
            return {
              signedToken: tk.signedToken,
              tokenGateId: tk.tokenGate.id
            };
          }) ?? [],
        joinType
      });

      showMessage(`You have joined the ${tokenGateResult?.space.name} workspace.`, 'success');

      await refreshUserWithWeb3Account();

      const spaceExists = spaces.some((s) => s.id === tokenGateResult?.space.id);

      // Refresh spaces as otherwise the redirect will not work
      if (!spaceExists) {
        setSpaces([...spaces, tokenGateResult?.space as Space]);
      }
      onSuccess(tokenGateResult?.space as Space);
    } catch (err: any) {
      showMessage(err?.message ?? err ?? 'An unknown error occurred', 'error');
    }

    setJoiningSpace(false);
  }

  if (isLoading) {
    return <LoadingComponent height='80px' isLoading={true} />;
  }

  if (!isLoading && (!tokenGates || tokenGates?.length === 0)) {
    return (
      <Alert data-test='token-gate-empty-state' severity='info' sx={{ my: 1 }}>
        No token gates found for this workspace.
      </Alert>
    );
  }

  if (displayAccordion) {
    return (
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Token gates</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TokenGateContent
            tokenGates={tokenGates}
            tokenGateResult={tokenGateResult}
            verifyingGates={verifyingGates}
            evaluateEligibility={evaluateEligibility}
            joinSpace={onSubmit}
            joiningSpace={joiningSpace}
          />
        </AccordionDetails>
      </Accordion>
    );
  }

  return (
    <Stack mt={2}>
      <TokenGateContent
        tokenGates={tokenGates}
        tokenGateResult={tokenGateResult}
        verifyingGates={verifyingGates}
        evaluateEligibility={evaluateEligibility}
        joinSpace={onSubmit}
        joiningSpace={joiningSpace}
      />
    </Stack>
  );
}
