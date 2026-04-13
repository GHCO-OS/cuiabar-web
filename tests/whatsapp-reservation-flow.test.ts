import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_BUSINESS_CONTEXT } from '../worker/whatsapp/constants';
import { advanceReservationFlow } from '../worker/whatsapp/reservationFlow';

const emptyEnv = {} as never;

test('advanceReservationFlow inicia coleta de reserva', async () => {
  const result = await advanceReservationFlow(emptyEnv, DEFAULT_BUSINESS_CONTEXT, {
    currentFlow: null,
    messageText: 'Quero reservar uma mesa',
    phoneE164: '+551933058878',
    fallbackCustomerName: 'Leonardo Silva',
    profileEmail: null,
  });

  assert.equal(result.reservationFlowUpdate?.currentStep, 'date');
  assert.equal(result.reply?.templateKey, 'reservation.start');
});

test('advanceReservationFlow captura data e pede horario', async () => {
  const result = await advanceReservationFlow(emptyEnv, DEFAULT_BUSINESS_CONTEXT, {
    currentFlow: {
      id: 'flow_1',
      conversation_id: 'conv_1',
      customer_profile_id: 'profile_1',
      status: 'collecting',
      current_step: 'date',
      customer_name: null,
      reservation_date: null,
      reservation_time: null,
      guest_count: null,
      notes: null,
      reservation_id: null,
      reservation_code: null,
      metadata_json: '{}',
      completed_at: null,
      created_at: '2026-04-08T00:00:00.000Z',
      updated_at: '2026-04-08T00:00:00.000Z',
    },
    messageText: '18/04',
    phoneE164: '+551933058878',
    fallbackCustomerName: 'Leonardo Silva',
    profileEmail: null,
  });

  assert.equal(result.reservationFlowUpdate?.currentStep, 'time');
  assert.match(result.reply?.text ?? '', /horarios disponiveis/i);
});
