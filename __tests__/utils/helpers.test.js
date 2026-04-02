// Test example for helpers
import {
  formatCurrency,
  formatPhoneNumber,
  getInitials,
} from '../../utils/helpers';

describe('Helper Functions', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const result = formatCurrency(1000);
      expect(result).toContain('1,000');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format phone number correctly', () => {
      const result = formatPhoneNumber('08012345678');
      expect(result).toBeTruthy();
    });
  });

  describe('getInitials', () => {
    it('should get initials from name', () => {
      const result = getInitials('John Doe');
      expect(result).toBe('JD');
    });
  });
});
