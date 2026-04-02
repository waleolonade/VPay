import api from './api';
import { endpoints } from '../constants/apiEndpoints';

export const invoiceService = {
  /**
   * Create a new payment request (invoice)
   * @param {{ customerName, customerEmail, amount, description, dueDate }} data 
   */
  createInvoice: (data) => api.post(endpoints.INVOICES, data),

  /**
   * Get all invoices, optionally filtered by type (present/previous)
   * @param {'present'|'previous'} type 
   */
  getInvoices: (type) => api.get(endpoints.INVOICES, { params: { type } }),

  /**
   * Get analytics for invoices (total requested, paid, pending)
   */
  getStats: () => api.get(endpoints.INVOICE_STATS),
};
