import { describe, it, expect } from 'vitest';
import { ValidationUtils } from '../../../../src/core/utils/ValidationUtils.js';

describe('ValidationUtils', () => {
  describe('email', () => {
    it('should validate correct emails', () => {
      expect(ValidationUtils.email('test@example.com')).toBe(true);
      expect(ValidationUtils.email('a.b@c.co')).toBe(true);
    });
    it('should reject invalid emails', () => {
      expect(ValidationUtils.email('test@')).toBe(false);
      expect(ValidationUtils.email('test.com')).toBe(false);
      expect(ValidationUtils.email('')).toBe(false);
    });
  });

  describe('phone', () => {
    it('should validate correct phone numbers', () => {
      expect(ValidationUtils.phone('0123456789')).toBe(true);
      expect(ValidationUtils.phone('0987654321')).toBe(true);
      expect(ValidationUtils.phone('012345678901')).toBe(true);
    });
    it('should reject invalid phones', () => {
      expect(ValidationUtils.phone('123')).toBe(false);
      expect(ValidationUtils.phone('01234567890')).toBe(false);
      expect(ValidationUtils.phone('abc')).toBe(false);
      expect(ValidationUtils.phone('')).toBe(false);
    });
    it('should trim spaces', () => {
      expect(ValidationUtils.phone('0123 456 789')).toBe(true);
    });
  });

  describe('required', () => {
    it('should return true for non-empty strings', () => {
      expect(ValidationUtils.required('hello')).toBe(true);
      expect(ValidationUtils.required(' a ')).toBe(true);
    });
    it('should return false for empty or whitespace', () => {
      expect(ValidationUtils.required('')).toBe(false);
      expect(ValidationUtils.required('   ')).toBe(false);
      expect(ValidationUtils.required(null)).toBe(false);
      expect(ValidationUtils.required(undefined)).toBe(false);
    });
  });

  describe('minLength', () => {
    it('should return true if length >= min', () => {
      expect(ValidationUtils.minLength('abc', 3)).toBe(true);
      expect(ValidationUtils.minLength('abcd', 3)).toBe(true);
    });
    it('should return false if length < min', () => {
      expect(ValidationUtils.minLength('ab', 3)).toBe(false);
      expect(ValidationUtils.minLength('', 1)).toBe(false);
    });
  });

  describe('maxLength', () => {
    it('should return true if length <= max', () => {
      expect(ValidationUtils.maxLength('abc', 3)).toBe(true);
      expect(ValidationUtils.maxLength('ab', 3)).toBe(true);
    });
    it('should return false if length > max', () => {
      expect(ValidationUtils.maxLength('abcd', 3)).toBe(false);
    });
  });

  describe('cardNumber', () => {
    it('should validate 16-digit card numbers', () => {
      expect(ValidationUtils.cardNumber('1234567890123456')).toBe(true);
      expect(ValidationUtils.cardNumber('1234 5678 9012 3456')).toBe(true);
    });
    it('should reject other lengths', () => {
      expect(ValidationUtils.cardNumber('123456789012345')).toBe(false);
      expect(ValidationUtils.cardNumber('')).toBe(false);
    });
  });

  describe('expiry', () => {
    it('should validate MM/YY format', () => {
      expect(ValidationUtils.expiry('01/25')).toBe(true);
      expect(ValidationUtils.expiry('12/30')).toBe(true);
    });
    it('should reject invalid months or format', () => {
      expect(ValidationUtils.expiry('13/25')).toBe(false);
      expect(ValidationUtils.expiry('1/25')).toBe(false);
      expect(ValidationUtils.expiry('01-25')).toBe(false);
      expect(ValidationUtils.expiry('')).toBe(false);
    });
  });

  describe('cvv', () => {
    it('should validate 3 or 4 digit CVV', () => {
      expect(ValidationUtils.cvv('123')).toBe(true);
      expect(ValidationUtils.cvv('1234')).toBe(true);
    });
    it('should reject non-numeric or wrong length', () => {
      expect(ValidationUtils.cvv('12')).toBe(false);
      expect(ValidationUtils.cvv('12345')).toBe(false);
      expect(ValidationUtils.cvv('abc')).toBe(false);
    });
  });
});