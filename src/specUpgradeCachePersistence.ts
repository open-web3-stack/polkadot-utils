import { SPEC_UPGRADE_STORAGE_KEY, type UpgradeInfo } from './appHelpers'
import type { NetworkId } from './polkadotNetworks'

const parseSpecVersion = (value: string) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    return undefined
  }
  return Math.trunc(parsed)
}

const normalizeUpgrade = (upgrade: UpgradeInfo): UpgradeInfo => ({
  blockNumber: Math.trunc(upgrade.blockNumber),
  timestampMs: upgrade.timestampMs,
})

export const persistSpecUpgradeCache = (
  cache: Map<string, UpgradeInfo>,
  networkStorageKeys: Map<NetworkId, string>,
  currentSpecVersions?: Map<NetworkId, number>,
) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    const groupedByNetwork = new Map<NetworkId, Array<[number, UpgradeInfo]>>()
    const staleCacheKeys: string[] = []

    for (const [cacheKey, upgradeInfo] of cache.entries()) {
      const separatorIndex = cacheKey.indexOf(':')
      if (separatorIndex === -1) {
        staleCacheKeys.push(cacheKey)
        continue
      }
      const networkId = cacheKey.slice(0, separatorIndex) as NetworkId
      const specVersionValue = cacheKey.slice(separatorIndex + 1)
      const specVersion = parseSpecVersion(specVersionValue)
      if (specVersion == null) {
        staleCacheKeys.push(cacheKey)
        continue
      }
      const currentSpecVersion = currentSpecVersions?.get(networkId)
      if (currentSpecVersion != null && specVersion !== currentSpecVersion) {
        staleCacheKeys.push(cacheKey)
        continue
      }
      const entriesForNetwork = groupedByNetwork.get(networkId)
      const normalizedUpgrade = normalizeUpgrade(upgradeInfo)
      if (entriesForNetwork) {
        entriesForNetwork.push([specVersion, normalizedUpgrade])
      } else {
        groupedByNetwork.set(networkId, [[specVersion, normalizedUpgrade]])
      }
    }

    for (const cacheKey of staleCacheKeys) {
      cache.delete(cacheKey)
    }

    const persistedKeys = new Set<string>()

    for (const [networkId, entries] of groupedByNetwork) {
      const storageKey = networkStorageKeys.get(networkId)
      if (!storageKey) {
        continue
      }
      persistedKeys.add(storageKey)
      window.localStorage.setItem(storageKey, JSON.stringify(entries))
    }

    for (const storageKey of networkStorageKeys.values()) {
      if (!persistedKeys.has(storageKey)) {
        window.localStorage.removeItem(storageKey)
      }
    }

    window.localStorage.removeItem(SPEC_UPGRADE_STORAGE_KEY)
  } catch {
    // Keep the app running even if persistence fails.
  }
}
