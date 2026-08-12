const { spawnSync } = require('node:child_process');

const BLOCKING_SEVERITIES = new Set(['high', 'critical']);
const TEMPORARY_EXCEPTIONS = new Map([
  [
    'https://github.com/advisories/GHSA-w3rx-r6r6-pgpr',
    {
      dependency: 'image-size',
      expiresOn: '2026-09-30',
      reason: 'Metro build-time ICNS parser; no compatible patched release is available.',
    },
  ],
  [
    'https://github.com/advisories/GHSA-5p2g-fcmc-qvqq',
    {
      dependency: 'image-size',
      expiresOn: '2026-09-30',
      reason: 'Metro build-time JXL/HEIF parser; no compatible patched release is available.',
    },
  ],
]);

function collectRootAdvisories(name, vulnerabilities, trail = new Set()) {
  if (trail.has(name)) return [];

  const vulnerability = vulnerabilities[name];
  if (!vulnerability) {
    return [{ dependency: name, severity: 'unknown', url: null, unresolved: true }];
  }

  const nextTrail = new Set(trail);
  nextTrail.add(name);
  const roots = [];

  for (const cause of vulnerability.via || []) {
    if (typeof cause === 'string') {
      roots.push(...collectRootAdvisories(cause, vulnerabilities, nextTrail));
      continue;
    }

    roots.push({
      dependency: cause.dependency || cause.name || name,
      severity: cause.severity || vulnerability.severity || 'unknown',
      url: cause.url || null,
      unresolved: !cause.url,
    });
  }

  return roots;
}

function unique(items, keyOf) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyOf(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function evaluateAudit(report, now = new Date()) {
  const vulnerabilities = report?.vulnerabilities || {};
  const blockingEntries = Object.entries(vulnerabilities).filter(([, vulnerability]) =>
    BLOCKING_SEVERITIES.has(vulnerability.severity),
  );
  const failures = [];
  const allowed = [];

  for (const [name] of blockingEntries) {
    const roots = collectRootAdvisories(name, vulnerabilities);
    const blockingRoots = roots.filter(
      (root) => root.unresolved || BLOCKING_SEVERITIES.has(root.severity),
    );

    if (blockingRoots.length === 0) {
      failures.push({
        dependency: name,
        severity: vulnerabilities[name].severity,
        url: null,
        reason: 'Blocking vulnerability has no traceable high/critical root advisory.',
      });
      continue;
    }

    for (const root of blockingRoots) {
      const exception = root.url ? TEMPORARY_EXCEPTIONS.get(root.url) : null;
      const matchesException = exception && exception.dependency === root.dependency;
      const expiresAt = matchesException
        ? Date.parse(`${exception.expiresOn}T23:59:59.999Z`)
        : Number.NaN;
      if (matchesException && now.getTime() <= expiresAt) {
        allowed.push({
          ...root,
          expiresOn: exception.expiresOn,
          reason: exception.reason,
        });
      } else {
        failures.push({
          ...root,
          reason: matchesException
            ? `Temporary exception expired on ${exception.expiresOn}.`
            : root.unresolved
              ? 'Blocking vulnerability root could not be resolved.'
              : 'High/critical advisory is not allowlisted.',
        });
      }
    }
  }

  return {
    ok: failures.length === 0,
    allowed: unique(allowed, (item) => `${item.dependency}:${item.url}`),
    failures: unique(
      failures,
      (item) => `${item.dependency}:${item.url || 'unresolved'}:${item.reason}`,
    ),
    totals: report?.metadata?.vulnerabilities || null,
  };
}

function run() {
  const npmCliPath = process.env.npm_execpath;
  const command = npmCliPath ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const args = npmCliPath ? [npmCliPath, 'audit', '--json'] : ['audit', '--json'];
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });

  if (result.error) {
    console.error(`[dependency-audit] npm audit 실행 실패: ${result.error.message}`);
    process.exit(1);
  }

  let report;
  try {
    report = JSON.parse(result.stdout || '{}');
  } catch (error) {
    console.error(`[dependency-audit] npm audit JSON 파싱 실패: ${error.message}`);
    if (result.stderr) console.error(result.stderr.trim());
    process.exit(1);
  }

  if (report.error) {
    console.error(`[dependency-audit] npm audit 오류: ${report.error.summary || report.error.message}`);
    process.exit(1);
  }

  const evaluation = evaluateAudit(report);
  for (const exception of evaluation.allowed) {
    console.warn(
      `[dependency-audit] 임시 예외(~${exception.expiresOn}): ${exception.dependency} ${exception.url} — ${exception.reason}`,
    );
  }

  if (!evaluation.ok) {
    for (const failure of evaluation.failures) {
      console.error(
        `[dependency-audit] 차단: ${failure.dependency} ${failure.url || '(advisory 미확인)'} — ${failure.reason}`,
      );
    }
    process.exit(1);
  }

  const high = evaluation.totals?.high || 0;
  const critical = evaluation.totals?.critical || 0;
  console.log(
    `[dependency-audit] 통과: high ${high}, critical ${critical}; 임시 예외 ${evaluation.allowed.length}건`,
  );
}

if (require.main === module) run();

module.exports = { evaluateAudit };
