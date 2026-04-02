import api from './api';
import { endpoints } from '../constants/apiEndpoints';

export const bankService = {
  /**
   * Get all supported Nigerian banks
   */
  getBankList: async () => {
    const res = await api.get(endpoints.BANKS_LIST);
    return res;
  },

  /**
   * Get saved bank accounts and cards
   */
  getSavedBanksAndCards: async () => {
    const res = await api.get(endpoints.SAVED_BANKS);
    return res;
  },

  /**
   * Resolve account number to name
   */
  resolveAccount: async (accountNumber, bankCode) => {
    const res = await api.get(`${endpoints.RESOLVE_ACCOUNT}?accountNumber=${accountNumber}&bankCode=${bankCode}`);
    return res;
  },

  /**
   * Add a new bank account
   */
  addBankAccount: async (data) => {
    const res = await api.post(endpoints.BANK_ACCOUNTS, data);
    return res;
  },

  /**
   * Remove a bank account
   */
  removeBankAccount: async (id) => {
    const res = await api.delete(endpoints.BANK_ACCOUNT.replace(':id', id));
    return res;
  },

  /**
   * Set a bank account as default
   */
  setDefaultAccount: async (id) => {
    const res = await api.patch(endpoints.SET_DEFAULT_ACCOUNT.replace(':id', id));
    return res;
  },

  /**
   * Add a card
   */
  addCard: async (data) => {
    const res = await api.post(endpoints.CREATE_CARD_VIRTUAL, data);
    return res;
  },

  /**
   * Remove a card
   */
  removeCard: async (id) => {
    const res = await api.delete(endpoints.CARD.replace(':id', id));
    return res;
  },
};
