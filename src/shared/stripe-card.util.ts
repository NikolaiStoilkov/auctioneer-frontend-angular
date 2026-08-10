import { Stripe, StripeCardElement } from '@stripe/stripe-js';

/**
 * Shared appearance options for the Stripe card input, so the profile
 * and add-credits pages present an identical card element.
 */
export const STRIPE_CARD_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      fontSize: '16px',
      color: '#333',
      '::placeholder': { color: '#999' },
    },
    invalid: { color: '#d32f2f' },
  },
} as const;

/**
 * Creates a Stripe card element, mounts it into the given container, and
 * wires the standard change / focus / blur handlers.
 *
 * Centralizes the card-element setup that was previously duplicated in the
 * profile and add-credits pages.
 *
 * @param stripe Loaded Stripe.js instance.
 * @param containerId Id of the DOM element to mount the card input into.
 * @param onError Callback receiving the current validation error message
 *   (empty string when the card input is valid).
 * @returns The created {@link StripeCardElement}, or `null` if Stripe is
 *   not available.
 */
export function createAndMountStripeCard(
  stripe: Stripe | null,
  containerId: string,
  onError: (message: string) => void,
): StripeCardElement | null {
  if (!stripe) {
    return null;
  }

  const cardElement = stripe.elements().create('card', STRIPE_CARD_OPTIONS);

  const container = document.getElementById(containerId);
  if (container) {
    cardElement.mount(container);

    cardElement.on('change', (event) =>
      onError(event.error ? (event.error.message ?? '') : ''),
    );
    cardElement.on('focus', () => container.classList.add('focused'));
    cardElement.on('blur', () => container.classList.remove('focused'));
  }

  return cardElement;
}
