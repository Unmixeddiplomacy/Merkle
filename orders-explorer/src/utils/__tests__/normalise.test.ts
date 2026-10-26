import { describe, it, expect } from 'vitest';
import { normaliseOrder, deduplicateOrders } from '../normalise';
import type { RawOrder, Order } from '../../types/order';

describe('normaliseOrder', () => {
  it('unifies customer_name in v1 and customerName in v2', () => {
    const rawV1: RawOrder = {
      id: 'ORD-001',
      schemaVersion: 1,
      customer_name: 'Priya Patel',
      amount: 10000,
      createdAt: '2025-03-01T00:00:00Z',
    };
    const orderV1 = normaliseOrder(rawV1, 0);
    expect(orderV1?.customer).toBe('Priya Patel');

    const rawV2: RawOrder = {
      id: 'ORD-002',
      schemaVersion: 2,
      customerName: 'Aarav Mehta',
      amount: 500,
      createdAt: '2025-03-01T00:00:00Z',
    };
    const orderV2 = normaliseOrder(rawV2, 1);
    expect(orderV2?.customer).toBe('Aarav Mehta');
  });

  it('converts paise to rupees for schemaVersion 1 and leaves schemaVersion 2 rupees intact', () => {
    const rawV1: RawOrder = {
      id: 'ORD-001',
      schemaVersion: 1,
      amount: 250000, // 250000 paise = 2500 INR
      createdAt: '2025-03-01T00:00:00Z',
    };
    expect(normaliseOrder(rawV1, 0)?.amountINR).toBe(2500);

    const rawV2: RawOrder = {
      id: 'ORD-002',
      schemaVersion: 2,
      amount: 2500, // 2500 INR
      createdAt: '2025-03-01T00:00:00Z',
    };
    expect(normaliseOrder(rawV2, 1)?.amountINR).toBe(2500);
  });

  it('parses all four createdAt date formats', () => {
    // 1. ISO with TZ
    const o1 = normaliseOrder({ id: '1', schemaVersion: 2, amount: 100, createdAt: '2025-03-14T09:30:00.000Z' }, 0);
    expect(o1?.createdAt.toISOString()).toBe('2025-03-14T09:30:00.000Z');

    // 2. ISO without TZ (treated as UTC)
    const o2 = normaliseOrder({ id: '2', schemaVersion: 2, amount: 100, createdAt: '2025-03-14T09:30:00' }, 1);
    expect(o2?.createdAt.toISOString()).toBe('2025-03-14T09:30:00.000Z');

    // 3. Epoch seconds (number)
    const o3 = normaliseOrder({ id: '3', schemaVersion: 2, amount: 100, createdAt: 1741944600 }, 2);
    expect(o3?.createdAt.getTime()).toBe(1741944600 * 1000);

    // 4. DD/MM/YYYY string
    const o4 = normaliseOrder({ id: '4', schemaVersion: 2, amount: 100, createdAt: '14/03/2025' }, 3);
    expect(o4?.createdAt.toISOString()).toBe('2025-03-14T00:00:00.000Z');
  });

  it('canonicalises status to lowercase and region to uppercase', () => {
    const raw: RawOrder = {
      id: 'ORD-001',
      schemaVersion: 2,
      amount: 100,
      status: 'Shipped',
      region: 'north',
      createdAt: '2025-03-01T00:00:00Z',
    };
    const order = normaliseOrder(raw, 0);
    expect(order?.status).toBe('shipped');
    expect(order?.region).toBe('NORTH');
  });

  it('strips HTML tags from notes to prevent XSS', () => {
    const raw: RawOrder = {
      id: 'ORD-001',
      schemaVersion: 2,
      amount: 100,
      notes: '<script>alert("hack")</script>Please leave with <b>neighbor</b>',
      createdAt: '2025-03-01T00:00:00Z',
    };
    const order = normaliseOrder(raw, 0);
    expect(order?.notes).toBe('alert("hack")Please leave with neighbor');
  });

  it('normalises missing priority to null', () => {
    const raw: RawOrder = {
      id: 'ORD-001',
      schemaVersion: 2,
      amount: 100,
      createdAt: '2025-03-01T00:00:00Z',
    };
    const order = normaliseOrder(raw, 0);
    expect(order?.priority).toBeNull();
  });
});

describe('deduplicateOrders', () => {
  it('deduplicates duplicate IDs by keeping the one with later updatedAt', () => {
    const orderOlder: Order = {
      id: 'ORD-DUP',
      customer: 'A',
      customerEmail: '',
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
      notes: 'older',
      schemaVersion: 2,
    };
    const orderNewer: Order = {
      ...orderOlder,
      updatedAt: new Date('2025-01-05'),
      notes: 'newer',
    };

    const result = deduplicateOrders([orderOlder, orderNewer]);
    expect(result.length).toBe(1);
    expect(result[0].notes).toBe('newer');
  });

  it('keeps record with updatedAt over record without updatedAt', () => {
    const orderNoUpdate: Order = {
      id: 'ORD-DUP',
      customer: 'A',
      customerEmail: '',
      status: 'pending',
      amountINR: 100,
      currency: 'INR',
      createdAt: new Date('2025-01-01'),
      updatedAt: null,
      region: 'NORTH',
      channel: 'web',
      priority: 1,
      paymentMethod: 'upi',
      itemCount: 1,
      notes: 'no-update',
      schemaVersion: 2,
    };
    const orderWithUpdate: Order = {
      ...orderNoUpdate,
      updatedAt: new Date('2025-01-02'),
      notes: 'has-update',
    };

    const result = deduplicateOrders([orderNoUpdate, orderWithUpdate]);
    expect(result.length).toBe(1);
    expect(result[0].notes).toBe('has-update');
  });
});
