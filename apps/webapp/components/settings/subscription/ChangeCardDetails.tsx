import { log } from '@charmverse/core/log';
import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import UpdateCardModal from 'components/common/Modal/ModalWithButtons';
import { useSnackbar } from 'hooks/useSnackbar';
import type { CreatePaymentMethodRequest } from '@packages/lib/subscription/createPaymentMethod';
import type { UpdatePaymentMethodRequest } from '@packages/lib/subscription/updatePaymentMethod';

import { CardSection } from './CardSection';

export function ChangeCardDetails({
  spaceId,
  refetchSubscription
}: {
  spaceId: string;
  refetchSubscription: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { showMessage } = useSnackbar();
  const updatePaymentMethodPopup = usePopupState({ variant: 'popover', popupId: 'update-payment' });
  const [isDisabled, setIsDisabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { trigger: updatePaymentMethod } = useSWRMutation(
    `/spaces/${spaceId}/payment-method`,
    (_url, { arg }: Readonly<{ arg: UpdatePaymentMethodRequest }>) =>
      charmClient.subscription.updatePaymentMethod(spaceId, arg),
    {
      onError() {
        showMessage('Changing payment details failed!', 'error');
        setIsProcessing(false);
      },
      onSuccess() {
        showMessage('Changing payment details has been successful!', 'success');
        refetchSubscription();
      }
    }
  );

  const { trigger: createPaymentMethod } = useSWRMutation(
    `/spaces/${spaceId}/payment-method`,
    (_url, { arg }: Readonly<{ arg: CreatePaymentMethodRequest }>) =>
      charmClient.subscription.createPaymentMethod(spaceId, arg),
    {
      onError() {
        showMessage('Changing payment details failed!', 'error');
        setIsProcessing(false);
      }
    }
  );

  const handlePaymentMethodChange = async () => {
    if (!stripe || !elements) {
      return;
    }

    const cardNumber = elements.getElement(CardNumberElement);
    const cardExpiry = elements.getElement(CardExpiryElement);
    const cardCvc = elements.getElement(CardCvcElement);
    const isMissingDetails = !cardNumber || !cardExpiry || !cardCvc;

    if (isMissingDetails) {
      return;
    }

    setIsProcessing(true);

    const { error: createPaymentMethodError, paymentMethod: paymentMethodDetails } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumber
    });

    if (createPaymentMethodError) {
      showMessage('Payment failed! Please try again later.', 'error');
      log.error(`[stripe]: Failed creating a payment method. ${createPaymentMethodError.message}`, {
        errorType: createPaymentMethodError.type,
        errorCode: createPaymentMethodError.code
      });
      setIsProcessing(false);
      return;
    }

    const setupIntent = await createPaymentMethod({ paymentMethodId: paymentMethodDetails.id });

    if (setupIntent?.clientSecret) {
      const { error: cardSetupError } = await stripe.confirmCardSetup(setupIntent.clientSecret, {
        payment_method: paymentMethodDetails.id,
        return_url: `${window?.location.origin}?settingTab=subscription`
      });
      if (cardSetupError) {
        showMessage('Payment failed! You did not confirm your new card setup.', 'error');
        log.error(`[stripe]: Failed confirming card setup intent. ${cardSetupError.message}`, {
          errorType: cardSetupError.type,
          errorCode: cardSetupError.code
        });
        setIsProcessing(false);
        return;
      }
    }

    await updatePaymentMethod({ paymentMethodId: paymentMethodDetails.id });

    setIsProcessing(false);
  };

  const handleCardDetails = (disabled: boolean) => {
    setIsDisabled(disabled);
  };

  return (
    <>
      <Button {...bindTrigger(updatePaymentMethodPopup)} variant='text' sx={{ px: 0 }}>
        Update your payment details
      </Button>
      <UpdateCardModal
        open={updatePaymentMethodPopup.isOpen}
        onClose={updatePaymentMethodPopup.close}
        onConfirm={handlePaymentMethodChange}
        buttonText='Update card'
        disabled={isDisabled || isProcessing}
        title='Update your credit card details'
      >
        <CardSection disabled={isProcessing} handleCardDetails={handleCardDetails} />
      </UpdateCardModal>
    </>
  );
}
