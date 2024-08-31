import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51Ps0jVJjyO7AtH5SSlcmW7kQcwn60FnySTAeSclznOd0BN92nBNBSOUooo9iJ0WCTasnxOJZcyw4NviA3m7tSzGv00aEXgenK5'
);

export const bookTour = async (tourID) => {
  try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourID}`);
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
