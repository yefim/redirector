const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getClientIp } = require('../build/client-ip');

function request(flyIp, socketIp = '127.0.0.1') {
  return { get: name => name === 'Fly-Client-IP' ? flyIp : undefined, ip: socketIp };
}

test('uses valid Fly client IPv4 and IPv6 addresses', () => {
  assert.equal(getClientIp(request('203.0.113.42')), '203.0.113.42');
  assert.equal(getClientIp(request('2001:db8::42')), '2001:db8::42');
});

test('falls back to the socket IP for missing or malformed Fly headers', () => {
  for (const value of [undefined, '', 'invalid', '203.0.113.42, 198.51.100.1']) {
    assert.equal(getClientIp(request(value)), '127.0.0.1');
  }
  assert.equal(getClientIp({ get: () => undefined, ip: undefined }), null);
});
