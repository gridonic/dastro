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

// Whether a consumer's dependency range already sits within dastro's peer range: same breaking
// segment (major, or minor on 0.x) and a minimum at or above the peer's. `^7.4.2` needs no
// alignment to `^7.0.0`; rewriting it would only loosen the project's floor.
export function rangeWithinPeer(currentRange, peerRange) {
  const current = minimumVersion(currentRange);
  const peer = minimumVersion(peerRange);
  if (!current || !peer) return false;
  const [currentMajor, currentMinor] = current.split('.').map(Number);
  const [peerMajor, peerMinor] = peer.split('.').map(Number);
  if (currentMajor !== peerMajor) return false;
  if (peerMajor === 0 && currentMinor !== peerMinor) return false;
  return compareVersions(current, peer) >= 0;
}

function minimumVersion(range) {
  const match = String(range).match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return [match[1], match[2] ?? 0, match[3] ?? 0].join('.');
}
