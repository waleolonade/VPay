import api from './api';
import { endpoints } from '../constants/apiEndpoints';

export const cardService = {
  /** Get all cards for the user */
  getCards: () => api.get(endpoints.GET_CARDS),

  /** Request a new virtual card */
  requestVirtualCard: (cardBrand = 'Verve') => 
    api.post(endpoints.CREATE_CARD_VIRTUAL, { cardBrand }),

  /** Toggle card status (active/blocked) */
  toggleStatus: (cardId, status) => 
    api.patch(endpoints.CARD_STATUS.replace(':id', cardId), { status }),

  /** Get sensitive card details */
  getCardDetails: (cardId) => 
    api.get(endpoints.CARD_DETAILS.replace(':id', cardId)),
};
