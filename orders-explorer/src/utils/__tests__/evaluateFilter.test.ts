import { describe, it, expect } from 'vitest';
import { evaluateFilter } from '../evaluateFilter';
import type { Order } from '../../types/order';
import type { FilterState } from '../../types/filter';

const mockOrder: Order = {
  id: 'ORD-101',
  customer: 'Rahul Sharma',
  customerEmail: 'rahul@example.com',
  status: 'delivered',
  amountINR: 4500,
  currency: 'INR',
  createdAt: new Date('2025-03-10T10:00:00Z'),
  updatedAt: new Date('2025-03-11T12:00:00Z'),
  region: 'NORTH',
  channel: 'web',
  priority: 1,
  paymentMethod: 'upi',
  itemCount: 3,
  notes: 'Fragile package handle with care',
  schemaVersion: 2,
};

describe('evaluateFilter', () => {
  it('returns true when filter has no groups (empty filter)', () => {
    const filter: FilterState = { groups: [] };
    expect(evaluateFilter(mockOrder, filter)).toBe(true);
  });

  describe('Text conditions', () => {
    it('evaluates contains case-insensitively', () => {
      const filter: FilterState = {
        groups: [
          {
            id: 'g1',
            conditions: [{ type: 'text', field: 'customer', operator: 'contains', value: 'rahul' }],
          },
        ],
      };
      expect(evaluateFilter(mockOrder, filter)).toBe(true);
    });

    it('evaluates not_contains', () => {
      const filter: FilterState = {
        groups: [
          {
            id: 'g1',
            conditions: [{ type: 'text', field: 'customer', operator: 'not_contains', value: 'Vikram' }],
          },
        ],
      };
      expect(evaluateFilter(mockOrder, filter)).toBe(true);
    });

    it('evaluates equals', () => {
      const filter: FilterState = {
        groups: [
          {
            id: 'g1',
            conditions: [{ type: 'text', field: 'customer', operator: 'equals', value: 'Rahul Sharma' }],
          },
        ],
      };
      expect(evaluateFilter(mockOrder, filter)).toBe(true);
    });

    it('evaluates customerEmail contains and equals', () => {
      const emailFilter: FilterState = {
        groups: [
          {
            id: 'g1',
            conditions: [{ type: 'text', field: 'customerEmail', operator: 'contains', value: 'rahul@' }],
          },
        ],
      };
      expect(evaluateFilter(mockOrder, emailFilter)).toBe(true);
    });
  });

  describe('Number conditions', () => {
    it('evaluates greater than and less than', () => {
      const gtFilter: FilterState = {
        groups: [{ id: 'g1', conditions: [{ type: 'number', field: 'amountINR', operator: 'gt', value: 4000 }] }],
      };
      expect(evaluateFilter(mockOrder, gtFilter)).toBe(true);

      const ltFilter: FilterState = {
        groups: [{ id: 'g1', conditions: [{ type: 'number', field: 'amountINR', operator: 'lt', value: 4000 }] }],
      };
      expect(evaluateFilter(mockOrder, ltFilter)).toBe(false);
    });

    it('evaluates between', () => {
      const filter: FilterState = {
        groups: [
          {
            id: 'g1',
            conditions: [{ type: 'number', field: 'amountINR', operator: 'between', value: 4000, value2: 5000 }],
          },
        ],
      };
      expect(evaluateFilter(mockOrder, filter)).toBe(true);
    });
  });

  describe('Date conditions', () => {
    it('evaluates before and after', () => {
      const afterFilter: FilterState = {
        groups: [
          {
            id: 'g1',
            conditions: [{ type: 'date', field: 'createdAt', operator: 'after', value: '2025-03-01' }],
          },
        ],
      };
      expect(evaluateFilter(mockOrder, afterFilter)).toBe(true);

      const beforeFilter: FilterState = {
        groups: [
          {
            id: 'g1',
            conditions: [{ type: 'date', field: 'createdAt', operator: 'before', value: '2025-03-01' }],
          },
        ],
      };
      expect(evaluateFilter(mockOrder, beforeFilter)).toBe(false);
    });
  });

  describe('Enum conditions', () => {
    it('matches when value is in selected array', () => {
      const filter: FilterState = {
        groups: [
          {
            id: 'g1',
            conditions: [{ type: 'enum', field: 'status', operator: 'one_of', values: ['shipped', 'delivered'] }],
          },
        ],
      };
      expect(evaluateFilter(mockOrder, filter)).toBe(true);
    });

    it('handles None priority properly', () => {
      const nullPriorityOrder: Order = { ...mockOrder, priority: null };
      const filter: FilterState = {
        groups: [
          {
            id: 'g1',
            conditions: [{ type: 'enum', field: 'priority', operator: 'one_of', values: ['None'] }],
          },
        ],
      };
      expect(evaluateFilter(nullPriorityOrder, filter)).toBe(true);
      expect(evaluateFilter(mockOrder, filter)).toBe(false);
    });
  });

  describe('Boolean Logic: Group OR and Multi-Group AND', () => {
    it('combines conditions inside a group with OR', () => {
      const filter: FilterState = {
        groups: [
          {
            id: 'g1',
            conditions: [
              { type: 'enum', field: 'status', operator: 'one_of', values: ['cancelled'] }, // false
              { type: 'text', field: 'customer', operator: 'contains', value: 'Sharma' }, // true
            ],
          },
        ],
      };
      expect(evaluateFilter(mockOrder, filter)).toBe(true);
    });

    it('combines multiple groups with AND', () => {
      const passingFilter: FilterState = {
        groups: [
          {
            id: 'g1',
            conditions: [{ type: 'enum', field: 'status', operator: 'one_of', values: ['delivered'] }], // true
          },
          {
            id: 'g2',
            conditions: [{ type: 'number', field: 'amountINR', operator: 'gt', value: 4000 }], // true
          },
        ],
      };
      expect(evaluateFilter(mockOrder, passingFilter)).toBe(true);

      const failingFilter: FilterState = {
        groups: [
          {
            id: 'g1',
            conditions: [{ type: 'enum', field: 'status', operator: 'one_of', values: ['delivered'] }], // true
          },
          {
            id: 'g2',
            conditions: [{ type: 'number', field: 'amountINR', operator: 'lt', value: 1000 }], // false
          },
        ],
      };
      expect(evaluateFilter(mockOrder, failingFilter)).toBe(false);
    });
  });
});
