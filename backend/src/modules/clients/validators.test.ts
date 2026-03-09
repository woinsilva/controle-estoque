import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clientIdParamSchema,
  createClientSchema,
  listClientsQuerySchema,
  updateClientSchema
} from './validators.js';

test('createClientSchema parses valid payload', () => {
  const parsed = createClientSchema.parse({
    fullName: ' Maria Silva ',
    email: 'Maria@Email.com',
    phone: '(11) 99999-8888',
    active: true
  });

  assert.equal(parsed.fullName, 'Maria Silva');
  assert.equal(parsed.email, 'maria@email.com');
});

test('createClientSchema rejects invalid payload', () => {
  const result = createClientSchema.safeParse({
    fullName: 'A',
    phone: '123'
  });
  assert.equal(result.success, false);
});

test('updateClientSchema allows partial payload', () => {
  const parsed = updateClientSchema.parse({
    notes: 'Cliente recorrente.'
  });
  assert.equal(parsed.notes, 'Cliente recorrente.');
});

test('listClientsQuerySchema sets defaults', () => {
  const parsed = listClientsQuerySchema.parse({});
  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 20);
  assert.equal(parsed.sortBy, 'createdAt');
  assert.equal(parsed.sortOrder, 'desc');
});

test('clientIdParamSchema validates object id', () => {
  const ok = clientIdParamSchema.safeParse({ id: '507f1f77bcf86cd799439011' });
  const bad = clientIdParamSchema.safeParse({ id: 'invalid-id' });
  assert.equal(ok.success, true);
  assert.equal(bad.success, false);
});
