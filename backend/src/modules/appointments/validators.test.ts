import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appointmentIdParamSchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  updateAppointmentStatusSchema
} from './validators.js';

test('createAppointmentSchema parses valid payload', () => {
  const parsed = createAppointmentSchema.parse({
    clientId: '507f1f77bcf86cd799439011',
    scheduledAt: '2026-03-15T09:00:00.000Z',
    status: 'SCHEDULED',
    notes: 'Primeira consulta'
  });

  assert.equal(parsed.clientId, '507f1f77bcf86cd799439011');
  assert.equal(parsed.status, 'SCHEDULED');
});

test('listAppointmentsQuerySchema sets defaults', () => {
  const parsed = listAppointmentsQuerySchema.parse({});
  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 20);
  assert.equal(parsed.sortBy, 'scheduledAt');
  assert.equal(parsed.sortOrder, 'desc');
});

test('updateAppointmentStatusSchema accepts allowed status', () => {
  const ok = updateAppointmentStatusSchema.safeParse({ status: 'COMPLETED' });
  const bad = updateAppointmentStatusSchema.safeParse({ status: 'UNKNOWN' });
  assert.equal(ok.success, true);
  assert.equal(bad.success, false);
});

test('appointmentIdParamSchema validates object id', () => {
  const ok = appointmentIdParamSchema.safeParse({ id: '507f1f77bcf86cd799439011' });
  const bad = appointmentIdParamSchema.safeParse({ id: 'abc' });
  assert.equal(ok.success, true);
  assert.equal(bad.success, false);
});
