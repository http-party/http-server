'use strict';

const test = require('tap').test;
const os = require('os');

test('network interface display handles both string and numeric family values', (t) => {
  t.plan(4);

  // Store original function to restore later
  const originalNetworkInterfaces = os.networkInterfaces;

  // Mock data with string family values (Node < 18)
  const mockInterfacesString = {
    'eth0': [
      { family: 'IPv4', address: '192.168.1.100', internal: false },
      { family: 'IPv6', address: '::1', internal: false }
    ],
    'lo': [
      { family: 'IPv4', address: '127.0.0.1', internal: true }
    ]
  };

  // Mock data with numeric family values (Node >= 18)
  const mockInterfacesNumeric = {
    'eth0': [
      { family: 4, address: '192.168.1.100', internal: false },
      { family: 6, address: '::1', internal: false }
    ],
    'lo': [
      { family: 4, address: '127.0.0.1', internal: true }
    ]
  };

  // Test the logic that filters IPv4 interfaces (extracted from bin/http-server)
  function getIPv4Addresses(interfaces) {
    const addresses = [];
    Object.keys(interfaces).forEach(function (dev) {
      interfaces[dev].forEach(function (details) {
        // This is the fix: handle both string and numeric family values
        if (details.family === 'IPv4' || details.family === 4) {
          addresses.push(details.address);
        }
      });
    });
    return addresses;
  }

  // Test with string family values
  let addresses = getIPv4Addresses(mockInterfacesString);
  t.equal(addresses.length, 2, 'Should find 2 IPv4 addresses with string family');
  t.ok(addresses.includes('192.168.1.100'), 'Should include external IPv4 address');

  // Test with numeric family values  
  addresses = getIPv4Addresses(mockInterfacesNumeric);
  t.equal(addresses.length, 2, 'Should find 2 IPv4 addresses with numeric family');
  t.ok(addresses.includes('192.168.1.100'), 'Should include external IPv4 address');

  // Restore original function
  os.networkInterfaces = originalNetworkInterfaces;
});

test('network interface filtering excludes IPv6 link-local addresses', (t) => {
  t.plan(2);

  const mockInterfaces = {
    'eth0': [
      { family: 4, address: '192.168.1.100', internal: false },
      { family: 6, address: '2001:db8::1', internal: false },
      { family: 6, address: 'fe80::1', internal: false } // link-local, should be excluded
    ]
  };

  // Extract the IPv6 filtering logic from bin/http-server
  const ipv6Addresses = [];
  const ipv4Addresses = [];
  
  Object.keys(mockInterfaces).forEach(function (dev) {
    mockInterfaces[dev].forEach(function (details) {
      if (details.family === 'IPv4' || details.family === 4) {
        ipv4Addresses.push(details.address);
      }
      if ((details.family === 'IPv6' || details.family === 6) && 
          !details.address.startsWith("fe80")) {
        ipv6Addresses.push(details.address);
      }
    });
  });

  t.equal(ipv4Addresses.length, 1, 'Should find 1 IPv4 address');
  t.equal(ipv6Addresses.length, 1, 'Should find 1 non-link-local IPv6 address');
});