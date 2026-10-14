// Compares `x.y.z` versions with an optional `-<label>.<n>` prerelease suffix (e.g. `3.3.0-beta.1`).
// A prerelease ranks below its release, so upgrading from `3.3.0-beta.1` still applies the `3.3.0` patch.
export function compareVersions(a, b) {
  const [releaseA, prereleaseA] = a.split('-');
  const [releaseB, prereleaseB] = b.split('-');

  const partsA = releaseA.split('.').map(Number);
  const partsB = releaseB.split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA !== numB) return numA - numB;
  }

  if (!prereleaseA || !prereleaseB) {
    return (prereleaseA ? -1 : 0) - (prereleaseB ? -1 : 0);
  }

  return prereleaseA.localeCompare(prereleaseB, 'en', { numeric: true });
}
