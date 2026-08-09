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
assert.equal(evaluateAudit(allowedReport).ok, true);
assert.equal(evaluateAudit(allowedReport).allowed.length, 1);

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
