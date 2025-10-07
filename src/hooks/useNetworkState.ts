import type { ApiPromise } from '@polkadot/api'
import type { Header } from '@polkadot/types/interfaces'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  estimateSpecUpgradeSearchSteps,
  findSpecUpgradeBlock,
  getSpecUpgradeStorageKey,
  isValidUpgradeInfo,
  readSpecVersion,
  readTimestampMs,
  SPEC_UPGRADE_STORAGE_KEY,
  type UpgradeInfo,
} from '../appHelpers'
import { getApi, type NetworkId, networkDefinitions, refreshApi } from '../polkadotNetworks'
import { persistSpecUpgradeCache } from '../specUpgradeCachePersistence'

const NETWORK_STORAGE_KEYS = new Map<NetworkId, string>(
  networkDefinitions.map((network) => [network.id, getSpecUpgradeStorageKey(network.id)] as const),
)

export type NetworkRowState = {
  blockNumber?: number
  timestampMs?: number
  specVersion?: number
  upgradedAt?: UpgradeInfo
  upgradeError?: string
  upgradeSearch?: {
    attempts: number
    estimatedTotal: number
  }
  error?: string
}

type NetworkState = Partial<Record<NetworkId, NetworkRowState>>

export const useNetworkState = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({})
  const subscriptionsRef = useRef(new Map<NetworkId, () => void>())
  const cancelledRef = useRef(false)
  const specUpgradeCacheRef = useRef(new Map<string, UpgradeInfo>())
  const specUpgradePromisesRef = useRef(new Map<string, Promise<UpgradeInfo>>())
  const apisRef = useRef(new Map<NetworkId, ApiPromise>())
  const pendingUpgradeRequestsRef = useRef(new Set<string>())
  const currentSpecVersionsRef = useRef(new Map<NetworkId, number>())

  const persistCache = useCallback(() => {
    persistSpecUpgradeCache(specUpgradeCacheRef.current, NETWORK_STORAGE_KEYS, currentSpecVersionsRef.current)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    const cache = specUpgradeCacheRef.current

    const loadNetworkEntries = (networkId: NetworkId, storedValue: string) => {
      try {
        const parsed: unknown = JSON.parse(storedValue)
        if (!Array.isArray(parsed)) {
          return
        }
        for (const entry of parsed) {
          if (!Array.isArray(entry) || entry.length !== 2) {
            continue
          }
          const [specVersionRaw, value] = entry
          const specVersion = typeof specVersionRaw === 'number' ? specVersionRaw : Number.parseInt(String(specVersionRaw), 10)
          if (!Number.isFinite(specVersion) || !isValidUpgradeInfo(value)) {
            continue
          }
          cache.set(`${networkId}:${Math.trunc(specVersion)}`, {
            blockNumber: Math.trunc(value.blockNumber),
            timestampMs: value.timestampMs,
          })
        }
      } catch {
        // Ignore storage errors so the app keeps working even if persistence fails.
      }
    }

    for (const [networkId, storageKey] of NETWORK_STORAGE_KEYS) {
      const storedValue = window.localStorage.getItem(storageKey)
      if (storedValue) {
        loadNetworkEntries(networkId, storedValue)
      }
    }

    const legacyStoredValue = window.localStorage.getItem(SPEC_UPGRADE_STORAGE_KEY)
    if (legacyStoredValue) {
      try {
        const parsedValue: unknown = JSON.parse(legacyStoredValue)
        if (Array.isArray(parsedValue)) {
          for (const entry of parsedValue) {
            if (!Array.isArray(entry) || entry.length !== 2) {
              continue
            }
            const [key, value] = entry
            if (typeof key !== 'string' || !isValidUpgradeInfo(value)) {
              continue
            }
            cache.set(key, {
              blockNumber: Math.trunc(value.blockNumber),
              timestampMs: value.timestampMs,
            })
          }
        }
      } catch {
        // Ignore storage errors so the app keeps working even if persistence fails.
      }
      persistCache()
    } else {
      window.localStorage.removeItem(SPEC_UPGRADE_STORAGE_KEY)
    }
  }, [persistCache])

  const resolveSpecUpgradeBlock = useCallback(
    async (api: ApiPromise, networkId: NetworkId, blockNumber: number, specVersion: number) => {
      const resolvedCache = specUpgradeCacheRef.current
      const promisesCache = specUpgradePromisesRef.current
      const cacheKey = `${networkId}:${specVersion}`

      const cachedValue = resolvedCache.get(cacheKey)
      if (cachedValue != null) {
        return cachedValue
      }

      const existingPromise = promisesCache.get(cacheKey)
      if (existingPromise) {
        return existingPromise
      }

      const estimatedTotal = estimateSpecUpgradeSearchSteps(blockNumber)
      const updateProgressState = (attempts: number, estimated: number) => {
        if (cancelledRef.current) {
          return
        }
        setNetworkState((previous) => {
          const current = previous[networkId]
          if (!current) {
            return previous
          }
          const currentBlockNumber = current.blockNumber
          const currentSpecVersion = current.specVersion
          if (currentSpecVersion !== specVersion || currentBlockNumber == null || currentBlockNumber < blockNumber) {
            return previous
          }
          const nextAttempts = Math.max(0, Math.trunc(attempts))
          const nextEstimated = Math.max(nextAttempts, Math.trunc(estimated))
          const currentProgress = current.upgradeSearch
          if (currentProgress && currentProgress.attempts === nextAttempts && currentProgress.estimatedTotal === nextEstimated) {
            return previous
          }
          return {
            ...previous,
            [networkId]: {
              ...current,
              upgradeSearch: {
                attempts: nextAttempts,
                estimatedTotal: nextEstimated,
              },
            },
          }
        })
      }

      updateProgressState(0, estimatedTotal)

      const promise = findSpecUpgradeBlock(api, blockNumber, specVersion, (progress) => {
        updateProgressState(progress.attempts, progress.estimatedTotal)
      })
        .then((value) => {
          resolvedCache.set(cacheKey, value)
          persistCache()
          promisesCache.delete(cacheKey)
          return value
        })
        .catch((error) => {
          promisesCache.delete(cacheKey)
          throw error
        })

      promisesCache.set(cacheKey, promise)
      return promise
    },
    [persistCache],
  )

  const connectNetwork = useCallback(async (networkId: NetworkId, forceReconnect = false) => {
    const existingUnsubscribe = subscriptionsRef.current.get(networkId)
    if (existingUnsubscribe) {
      existingUnsubscribe()
      subscriptionsRef.current.delete(networkId)
    }
    apisRef.current.delete(networkId)
    for (const cacheKey of Array.from(pendingUpgradeRequestsRef.current)) {
      if (cacheKey.startsWith(`${networkId}:`)) {
        pendingUpgradeRequestsRef.current.delete(cacheKey)
      }
    }

    setNetworkState((previous) => ({
      ...previous,
      [networkId]: {},
    }))

    try {
      const api = forceReconnect ? await refreshApi(networkId) : await getApi(networkId)
      if (cancelledRef.current) {
        await api.disconnect()
        return
      }
      apisRef.current.set(networkId, api)

      const handleHeader = async (header: Header) => {
        try {
          const blockHash = header.hash.toHex()
          const blockNumber = header.number.toNumber()
          const [timestampMs, specVersion] = await Promise.all([readTimestampMs(api, blockHash), readSpecVersion(api, blockHash)])
          if (cancelledRef.current) {
            return
          }

          setNetworkState((previous) => {
            const current = previous[networkId]
            const currentBlock = current?.blockNumber
            if (currentBlock != null) {
              if (blockNumber < currentBlock) {
                return previous
              }
              if (blockNumber === currentBlock && !current?.error) {
                const currentTimestamp = current?.timestampMs
                if (currentTimestamp != null && timestampMs < currentTimestamp) {
                  return previous
                }
                if (currentTimestamp === timestampMs) {
                  const currentSpecVersion = current?.specVersion
                  if (currentSpecVersion != null) {
                    if (currentSpecVersion > specVersion) {
                      return previous
                    }
                    if (currentSpecVersion === specVersion) {
                      return previous
                    }
                  }
                }
              }
            }

            const nextUpgradedAt = current?.specVersion === specVersion ? current?.upgradedAt : undefined

            return {
              ...previous,
              [networkId]: {
                ...current,
                blockNumber,
                timestampMs,
                specVersion,
                upgradedAt: nextUpgradedAt,
                upgradeError: undefined,
                upgradeSearch: current?.specVersion === specVersion ? current?.upgradeSearch : undefined,
                error: undefined,
              },
            }
          })
        } catch (error) {
          if (cancelledRef.current) {
            return
          }
          const blockNumber = header.number.toNumber()
          setNetworkState((previous) => {
            const current = previous[networkId]
            const currentBlock = current?.blockNumber
            if (currentBlock != null) {
              if (currentBlock > blockNumber) {
                return previous
              }
              if (currentBlock === blockNumber && current?.timestampMs != null) {
                return previous
              }
            }

            return {
              ...previous,
              [networkId]: {
                ...current,
                error: error instanceof Error ? error.message : String(error),
                upgradeSearch: undefined,
              },
            }
          })
        }
      }

      try {
        const initialHash = await api.rpc.chain.getFinalizedHead()
        const initialHeader = await api.rpc.chain.getHeader(initialHash)
        await handleHeader(initialHeader)
      } catch (error) {
        if (!cancelledRef.current) {
          setNetworkState((previous) => ({
            ...previous,
            [networkId]: {
              ...previous[networkId],
              error: error instanceof Error ? error.message : String(error),
              upgradeSearch: undefined,
            },
          }))
        }
      }

      const unsubscribe = await api.rpc.chain.subscribeFinalizedHeads((header) => {
        handleHeader(header).catch((error) => {
          if (cancelledRef.current) {
            return
          }
          setNetworkState((previous) => ({
            ...previous,
            [networkId]: {
              ...previous[networkId],
              error: error instanceof Error ? error.message : String(error),
              upgradeSearch: undefined,
            },
          }))
        })
      })

      subscriptionsRef.current.set(networkId, () => {
        unsubscribe()
        apisRef.current.delete(networkId)
      })
    } catch (error) {
      if (cancelledRef.current) {
        return
      }
      apisRef.current.delete(networkId)
      setNetworkState((previous) => ({
        ...previous,
        [networkId]: {
          ...previous[networkId],
          error: error instanceof Error ? error.message : String(error),
          upgradeSearch: undefined,
        },
      }))
    }
  }, [])

  useEffect(() => {
    cancelledRef.current = false

    for (const network of networkDefinitions) {
      connectNetwork(network.id).catch((error) => {
        if (cancelledRef.current) {
          return
        }
        setNetworkState((previous) => ({
          ...previous,
          [network.id]: {
            ...previous[network.id],
            error: error instanceof Error ? error.message : String(error),
            upgradeSearch: undefined,
          },
        }))
      })
    }

    return () => {
      cancelledRef.current = true
      for (const unsubscribe of subscriptionsRef.current.values()) {
        unsubscribe()
      }
      subscriptionsRef.current.clear()
    }
  }, [connectNetwork])

  useEffect(() => {
    const specVersions = currentSpecVersionsRef.current
    const seen = new Set<NetworkId>()

    for (const [networkId, state] of Object.entries(networkState) as Array<[NetworkId, NetworkRowState | undefined]>) {
      if (state?.specVersion != null) {
        specVersions.set(networkId, state.specVersion)
        seen.add(networkId)
      }
    }

    for (const networkId of Array.from(specVersions.keys())) {
      if (!seen.has(networkId)) {
        specVersions.delete(networkId)
      }
    }
  }, [networkState])

  useEffect(() => {
    if (cancelledRef.current) {
      return
    }

    for (const [networkId, state] of Object.entries(networkState) as Array<[NetworkId, NetworkRowState | undefined]>) {
      if (!state) {
        continue
      }
      if (state.error) {
        continue
      }
      const { blockNumber, specVersion, upgradedAt, upgradeError } = state
      if (blockNumber == null || specVersion == null) {
        continue
      }
      if (upgradedAt != null || upgradeError != null) {
        continue
      }
      const api = apisRef.current.get(networkId)
      if (!api) {
        continue
      }
      const cacheKey = `${networkId}:${specVersion}`
      if (pendingUpgradeRequestsRef.current.has(cacheKey)) {
        continue
      }

      pendingUpgradeRequestsRef.current.add(cacheKey)

      resolveSpecUpgradeBlock(api, networkId, blockNumber, specVersion)
        .then((resolvedUpgrade) => {
          if (cancelledRef.current) {
            return
          }
          setNetworkState((previous) => {
            const current = previous[networkId]
            if (!current) {
              return previous
            }
            const currentBlockNumber = current.blockNumber
            if (current.specVersion !== specVersion || (currentBlockNumber != null && currentBlockNumber < blockNumber)) {
              return previous
            }
            const currentUpgrade = current.upgradedAt
            if (
              current.error == null &&
              currentUpgrade?.blockNumber === resolvedUpgrade.blockNumber &&
              currentUpgrade.timestampMs === resolvedUpgrade.timestampMs
            ) {
              return previous
            }
            return {
              ...previous,
              [networkId]: {
                ...current,
                upgradedAt: resolvedUpgrade,
                upgradeError: undefined,
                upgradeSearch: undefined,
                error: undefined,
              },
            }
          })
        })
        .catch((error) => {
          if (cancelledRef.current) {
            return
          }
          const message = error instanceof Error ? error.message : String(error)
          const formattedMessage = `Failed to resolve runtime upgrade block: ${message}`
          setNetworkState((previous) => {
            const current = previous[networkId]
            if (!current) {
              return previous
            }
            const currentBlockNumber = current.blockNumber
            if (current.specVersion !== specVersion || (currentBlockNumber != null && currentBlockNumber < blockNumber)) {
              return previous
            }
            if (current.upgradeError === formattedMessage) {
              return previous
            }
            return {
              ...previous,
              [networkId]: {
                ...current,
                upgradeError: formattedMessage,
                upgradeSearch: undefined,
              },
            }
          })
        })
        .finally(() => {
          pendingUpgradeRequestsRef.current.delete(cacheKey)
        })
    }
  }, [networkState, resolveSpecUpgradeBlock])

  const handleRefresh = useCallback(
    (networkId: NetworkId) => {
      connectNetwork(networkId, true).catch((error) => {
        if (cancelledRef.current) {
          return
        }
        setNetworkState((previous) => ({
          ...previous,
          [networkId]: {
            ...previous[networkId],
            error: error instanceof Error ? error.message : String(error),
            upgradeSearch: undefined,
          },
        }))
      })
    },
    [connectNetwork],
  )

  return { networkState, handleRefresh }
}
