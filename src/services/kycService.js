import api from './api';
import { endpoints } from '../constants/apiEndpoints';

export const kycService = {
  /**
   * Submit and verify a BVN (Bank Verification Number).
   * The backend validates the BVN against the NIBSS registry.
   * @param {string} bvn          11-digit BVN
   * @param {string} dateOfBirth  Format: YYYY-MM-DD
   */
  submitBvn: (bvn, dateOfBirth) =>
    api.post(endpoints.SUBMIT_BVN, { bvn, dateOfBirth }),

  /**
   * Submit and verify a NIN (National Identification Number).
   * @param {string} nin              11-digit NIN
   * @param {string} [idType]         Default: 'national_id'
   * @param {string} [documentImageUrl]  Optional uploaded ID image URL
   */
  submitNin: (nin, idType = 'national_id', documentImageUrl) =>
    api.post(endpoints.SUBMIT_NIN, {
      nin,
      idType,
      ...(documentImageUrl && { documentImageUrl }),
    }),
};
