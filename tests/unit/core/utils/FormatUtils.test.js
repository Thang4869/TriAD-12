import { describe, it, expect } from 'vitest';
import { FormatUtils } from '../../../../src/core/utils/FormatUtils.js';

describe('FormatUtils', () => {
  it('should format price', () => {
    expect(FormatUtils.price(150000)).toBe('150.000 ₫');
    expect(FormatUtils.price(0)).toBe('0 ₫');
    expect(FormatUtils.price(1234567)).toBe('1.234.567 ₫');
  });

  it('should format number', () => {
    expect(FormatUtils.number(1234567)).toBe('1.234.567');
    expect(FormatUtils.number(1000)).toBe('1.000');
    expect(FormatUtils.number(0)).toBe('0');
  });

  it('should format date', () => {
    const date = new Date(2026, 7, 15, 14, 30);
    const result = FormatUtils.date(date);
    expect(result).toContain('15');
    expect(result).toContain('tháng 8');
    expect(result).toContain('2026');
    expect(result).toContain('14:30');
  });

  it('should format date with custom options', () => {
    const date = new Date(2026, 7, 15);
    const result = FormatUtils.date(date, { month: 'short', day: '2-digit' });
    expect(result).toContain('thg 8');
    expect(result).toContain('15');
  });

  it('should generate order id', () => {
    const id = FormatUtils.orderId();
    expect(id).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/);
    const id2 = FormatUtils.orderId();
    expect(id).not.toBe(id2);
  });
});