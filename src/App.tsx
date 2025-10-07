import type { ApiPromise } from '@polkadot/api'
import type { Header } from '@polkadot/types/interfaces'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { getApi, type NetworkFamily, type NetworkId, networkDefinitions, networkGroups, refreshApi } from './polkadotNetworks'

type NetworkRowState = {
  blockNumber?: number
  timestampMs?: number
  error?: string
}

const readTimestampMs = async (api: ApiPromise, blockHash: string) => {
  const moment = await api.query.timestamp.now.at(blockHash)
  if (!moment) {
    throw new Error('Timestamp value not available')
  }

  const milliseconds = Number(moment.toBigInt())
  if (!Number.isFinite(milliseconds)) {
    throw new Error('Timestamp value is out of range')
  }

  return milliseconds
}

const formatLocalTime = (timestampMs: number | undefined) => {
  if (timestampMs == null) {
    return 'Loading…'
  }
  const date = new Date(timestampMs)
  const pad = (value: number) => value.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const formatBlockNumber = (blockNumber: number | undefined) => {
  if (blockNumber == null) {
    return 'Loading…'
  }
  return blockNumber.toLocaleString()
}

function App() {
  const [networkState, setNetworkState] = useState<Record<NetworkId, NetworkRowState>>({})
  const [activeFamily, setActiveFamily] = useState<NetworkFamily>('polkadot')
  const subscriptionsRef = useRef(new Map<NetworkId, () => void>())
  const cancelledRef = useRef(false)

  const labelById = useMemo<Record<NetworkId, string>>(
    () => Object.fromEntries(networkDefinitions.map((definition) => [definition.id, definition.label])) as Record<NetworkId, string>,
    [],
  )

  const connectNetwork = useCallback(async (networkId: NetworkId, forceReconnect = false) => {
    const existingUnsubscribe = subscriptionsRef.current.get(networkId)
    if (existingUnsubscribe) {
      existingUnsubscribe()
      subscriptionsRef.current.delete(networkId)
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

      const handleHeader = async (header: Header) => {
        try {
          const blockHash = header.hash.toHex()
          const blockNumber = header.number.toNumber()
          const timestampMs = await readTimestampMs(api, blockHash)
          if (cancelledRef.current) {
            return
          }

          setNetworkState((previous) => {
            const current = previous[networkId]
            const currentBlock = current?.blockNumber
            if (currentBlock != null) {
              if (currentBlock > blockNumber) {
                return previous
              }
              if (currentBlock === blockNumber && current?.timestampMs != null && current.timestampMs >= timestampMs) {
                return previous
              }
            }

            return {
              ...previous,
              [networkId]: {
                blockNumber,
                timestampMs,
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
            },
          }))
        })
      })

      subscriptionsRef.current.set(networkId, () => {
        unsubscribe()
      })
    } catch (error) {
      if (cancelledRef.current) {
        return
      }
      setNetworkState((previous) => ({
        ...previous,
        [networkId]: {
          ...previous[networkId],
          error: error instanceof Error ? error.message : String(error),
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
          },
        }))
      })
    },
    [connectNetwork],
  )

  const displayedGroups = useMemo(
    () => networkGroups.filter((group) => group.members.some((network) => network.family === activeFamily)),
    [activeFamily],
  )

  const tabs: Array<{ id: NetworkFamily; label: string }> = useMemo(
    () => [
      { id: 'polkadot', label: 'Polkadot' },
      { id: 'kusama', label: 'Kusama' },
    ],
    [],
  )

  return (
    <main className="app">
      <header className="app__header">
        <h1>Polkadot Network Blocks</h1>
        <p>Latest finalized block number and local time across relay chains and parachains.</p>
      </header>
      <nav className="app__tabs" aria-label="Network families">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={tab.id === activeFamily ? 'tab-button tab-button--active' : 'tab-button'}
            onClick={() => setActiveFamily(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="app__content">
        {displayedGroups.map((group) => (
          <section key={group.id} className="network-group">
            <h2 className="network-group__title">{group.label}</h2>
            <table className="network-table">
              <colgroup>
                <col />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Network</th>
                  <th scope="col">Block</th>
                  <th scope="col">Timestamp</th>
                  <th scope="col">Status</th>
                  <th scope="col" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {group.members.map((network) => {
                  const state = networkState[network.id]
                  const hasError = !!state?.error
                  const errorMessage = state?.error
                  const isReady = !hasError && state?.blockNumber != null && state?.timestampMs != null
                  const statusClass = hasError ? 'status status--error' : isReady ? 'status status--ok' : 'status status--pending'
                  const statusText = hasError ? 'Error' : isReady ? 'Connected' : 'Connecting…'
                  const tooltipId = hasError && errorMessage ? `${network.id}-error-tooltip` : undefined
                  return (
                    <tr key={network.id}>
                      <th scope="row">{labelById[network.id]}</th>
                      <td>{formatBlockNumber(state?.blockNumber)}</td>
                      <td>{hasError ? '—' : formatLocalTime(state?.timestampMs)}</td>
                      <td className="status-cell">
                        <div className={hasError ? 'status-wrapper status-wrapper--error' : 'status-wrapper'}>
                          <span className={statusClass} aria-live="polite" tabIndex={hasError ? 0 : undefined} aria-describedby={tooltipId}>
                            {statusText}
                          </span>
                          {hasError && errorMessage ? (
                            <div className="status-tooltip" role="tooltip" id={tooltipId}>
                              <span className="status-tooltip__message">{errorMessage}</span>
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="refresh-button"
                          onClick={() => handleRefresh(network.id)}
                          aria-label={`Reconnect ${labelById[network.id]}`}
                          title="Reconnect"
                        >
                          ↻
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </main>
  )
}

export default App
