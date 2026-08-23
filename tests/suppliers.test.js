import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSupplierName, resolveSupplierText, validateSupplier } from '../src/utils/suppliers.js';

test('supplier validation requires a name and validates optional email', () => {
  assert.equal(validateSupplier({ name: '' }), 'Supplier name is required.');
  assert.match(validateSupplier({ name: 'Acme', email: 'not-an-email' }), /valid supplier email/);
  assert.equal(validateSupplier({ name: 'Acme', email: 'ops@acme.test' }), '');
});

test('supplier resolution links exact active names and preserves unknown legacy text', () => {
  const suppliers = [{ id: 'supplier-1', name: 'Acme Pharma', active: true }, { id: 'supplier-2', name: 'Old Vendor', active: false }];
  assert.equal(normalizeSupplierName('  ACME PHARMA '), 'acme pharma');
  assert.deepEqual(resolveSupplierText(' acme pharma ', suppliers), { supplier_id: 'supplier-1', warning: '' });
  assert.match(resolveSupplierText('Old Vendor', suppliers).error, /inactive/);
  assert.match(resolveSupplierText('Historic Vendor', suppliers).warning, /legacy text/);
});
