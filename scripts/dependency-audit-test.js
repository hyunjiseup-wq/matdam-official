const assert = require('node:assert/strict');
const { evaluateAudit } = require('./dependency-audit');

const imageSizeAdvisory = {
  name: 'image-size',
  dependency: 'image-size',
  severity: 'high',
  url: 'https://github.com/advisories/GHSA-w3rx-r6r6-pgpr',
};

const allowedReport = {
  vulnerabilities: {
    'image-size': { severity: 'high', via: [imageSizeAdvisory] },
    metro: { severity: 'high', via: ['image-size'] },
  },
  metadata: { vulnerabilities: { high: 2, critical: 0 } },
};
const beforeExpiry = new Date('2026-08-10T00:00:00Z');
assert.equal(evaluateAudit(allowedReport, beforeExpiry).ok, true);
assert.equal(evaluateAudit(allowedReport, beforeExpiry).allowed.length, 1);
assert.equal(evaluateAudit(allowedReport, beforeExpiry).allowed[0].expiresOn, '2026-09-30');

const afterExpiry = new Date('2026-10-01T00:00:00Z');
assert.equal(evaluateAudit(allowedReport, afterExpiry).ok, false);
assert.match(evaluateAudit(allowedReport, afterExpiry).failures[0].reason, /expired/);

const newHighAdvisory = {
  vulnerabilities: {
    example: {
      severity: 'high',
      via: [
        {
          name: 'example',
          dependency: 'example',
          severity: 'high',
          url: 'https://github.com/advisories/GHSA-new-security-issue',
        },
      ],
    },
  },
};
assert.equal(evaluateAudit(newHighAdvisory).ok, false);

const wrongPackageForAllowedUrl = {
  vulnerabilities: {
    example: { severity: 'high', via: [{ ...imageSizeAdvisory, dependency: 'example' }] },
  },
};
assert.equal(evaluateAudit(wrongPackageForAllowedUrl).ok, false);

const unresolvedRoot = {
  vulnerabilities: {
    wrapper: { severity: 'critical', via: ['missing-package'] },
  },
};
assert.equal(evaluateAudit(unresolvedRoot).ok, false);

const moderateOnly = {
  vulnerabilities: {
    example: { severity: 'moderate', via: [] },
  },
};
assert.equal(evaluateAudit(moderateOnly).ok, true);

console.log('Dependency audit policy tests passed');
