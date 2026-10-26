import { describe, it, expect } from 'vitest';
import { sortOrders, nextSortState } from '../sort';
import type { Order } from '../../types/order';

const baseOrder: Order = {
  id: 'ORD-1',
  customer: 'Alice',
  customerEmail: 'alice@example.com',
  status: 'pending',
  amountINR: 100,
  currency: 'INR',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-02'),
  region: 'NORTH',
  channel: 'web',
  priority: 1,
  paymentMethod: 'upi',
  itemCount: 1,
  notes: '',
  schemaVersion: 2,
};

describe('sortOrders', () => {
  const o1: Order = { ...baseOrder, id: 'ORD-1', customer: 'Charlie', amountINR: 500, updatedAt: null, priority: 3 };
  const o2: Order = { ...baseOrder, id: 'ORD-2', customer: 'Alice', amountINR: 100, updatedAt: new Date('2025-02-01'), priority: 1 };
  const o3: Order = { ...baseOrder, id: 'ORD-3', customer: 'Bob', amountINR: 900, updatedAt: new Date('2025-01-15'), priority: null };

  it('returns original array reference if sort is null', () => {
    const orders = [o1, o2, o3];
    expect(sortOrders(orders, null)).toBe(orders);
  });

  it('sorts strings ascending and descending', () => {
    const asc = sortOrders([o1, o2, o3], { columnId: 'customer', direction: 'asc' });
    expect(asc.map((o) => o.customer)).toEqual(['Alice', 'Bob', 'Charlie']);

    const desc = sortOrders([o1, o2, o3], { columnId: 'customer', direction: 'desc' });
    expect(desc.map((o) => o.customer)).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it('sorts numbers ascending and descending', () => {
    const asc = sortOrders([o1, o2, o3], { columnId: 'amountINR', direction: 'asc' });
    expect(asc.map((o) => o.amountINR)).toEqual([100, 500, 900]);

    const desc = sortOrders([o1, o2, o3], { columnId: 'amountINR', direction: 'desc' });
    expect(desc.map((o) => o.amountINR)).toEqual([900, 500, 100]);
  });

  it('applies null-last rule for nullable updatedAt in both directions', () => {
    const asc = sortOrders([o1, o2, o3], { columnId: 'updatedAt', direction: 'asc' });
    // o1 has null updatedAt -> must be last
    expect(asc[2].id).toBe('ORD-1');
    expect(asc[0].id).toBe('ORD-3'); // 2025-01-15 < 2025-02-01
    expect(asc[1].id).toBe('ORD-2');

    const desc = sortOrders([o1, o2, o3], { columnId: 'updatedAt', direction: 'desc' });
    // o1 has null updatedAt -> still must be last!
    expect(desc[2].id).toBe('ORD-1');
    expect(desc[0].id).toBe('ORD-2');
    expect(desc[1].id).toBe('ORD-3');
  });

  it('applies null-last rule for priority in both directions', () => {
    const asc = sortOrders([o1, o2, o3], { columnId: 'priority', direction: 'asc' });
    expect(asc[2].priority).toBeNull(); // null always last
    expect(asc.map((o) => o.priority)).toEqual([1, 3, null]);

    const desc = sortOrders([o1, o2, o3], { columnId: 'priority', direction: 'desc' });
    expect(desc[2].priority).toBeNull(); // null always last
    expect(desc.map((o) => o.priority)).toEqual([3, 1, null]);
  });
});

describe('nextSortState', () => {
  it('cycles through null -> asc -> desc -> null', () => {
    const step1 = nextSortState(null, 'customer');
    expect(step1).toEqual({ columnId: 'customer', direction: 'asc' });

    const step2 = nextSortState(step1, 'customer');
    expect(step2).toEqual({ columnId: 'customer', direction: 'desc' });

    const step3 = nextSortState(step2, 'customer');
    expect(step3).toBeNull();
  });

  it('resets to asc when switching to a different column', () => {
    const current = { columnId: 'customer', direction: 'desc' as const };
    const next = nextSortState(current, 'amountINR');
    expect(next).toEqual({ columnId: 'amountINR', direction: 'asc' });
  });
});
