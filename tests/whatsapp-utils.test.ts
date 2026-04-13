import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeFreeText, normalizePhoneE164, phonesMatch, tryNormalizePhoneE164 } from '../worker/whatsapp/utils';

test('normalizePhoneE164 normaliza numero brasileiro com DDD', () => {
  assert.equal(normalizePhoneE164('(19) 3305-8878'), '+551933058878');
  assert.equal(normalizePhoneE164('551933058878'), '+551933058878');
});

test('normalizeFreeText remove acentos e normaliza espacos', () => {
  assert.equal(normalizeFreeText('  Cardápio   do  Cuiabár '), 'cardapio do cuiabar');
});

test('tryNormalizePhoneE164 retorna null para numero invalido', () => {
  assert.equal(tryNormalizePhoneE164('abc'), null);
});

test('phonesMatch compara variacoes do mesmo numero', () => {
  assert.equal(phonesMatch('(19) 3305-8878', '+55 19 3305-8878'), true);
  assert.equal(phonesMatch('+55 19 3305-8878', '+55 19 99999-9999'), false);
});
