import { useMemo, useState } from 'react'
import './App.css'
import { formatBlockNumber, formatLocalTime, formatRelativeTime, formatSpecVersion } from './appHelpers'
import { useNetworkState } from './hooks/useNetworkState'
import { type NetworkFamily, type NetworkId, networkDefinitions, networkGroups } from './polkadotNetworks'

function App() {
  const [activeFamily, setActiveFamily] = useState<NetworkFamily>('polkadot')
  const { networkState, handleRefresh } = useNetworkState()

  const labelById = useMemo<Record<NetworkId, string>>(
    () => Object.fromEntries(networkDefinitions.map((definition) => [definition.id, definition.label])) as Record<NetworkId, string>,
    [],
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
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Network</th>
                  <th scope="col">Block</th>
                  <th scope="col">Spec Version</th>
                  <th scope="col">Upgraded At</th>
                  <th scope="col">Status</th>
                  <th scope="col" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {group.members.map((network) => {
                  const state = networkState[network.id]
                  const hasError = !!state?.error
                  const errorMessage = state?.error
                  const upgradeError = state?.upgradeError
                  const upgradeTooltipId = upgradeError ? `${network.id}-upgrade-error` : undefined
                  const isReady = !hasError && state?.blockNumber != null
                  const statusClass = hasError ? 'status status--error' : isReady ? 'status status--ok' : 'status status--pending'
                  const statusText = hasError ? 'Error' : isReady ? 'Connected' : 'Connecting…'
                  const tooltipId = hasError && errorMessage ? `${network.id}-error-tooltip` : undefined
                  return (
                    <tr key={network.id}>
                      <th scope="row">{labelById[network.id]}</th>
                      <td>{formatBlockNumber(state?.blockNumber)}</td>
                      <td>{hasError ? '—' : formatSpecVersion(state?.specVersion)}</td>
                      <td>
                        {hasError ? (
                          '—'
                        ) : upgradeError ? (
                          <div className="status-wrapper status-wrapper--error">
                            <button type="button" className="upgrade-error-label" aria-describedby={upgradeTooltipId}>
                              Error
                            </button>
                            <div className="status-tooltip" role="tooltip" id={upgradeTooltipId}>
                              <span className="status-tooltip__message">{upgradeError}</span>
                            </div>
                          </div>
                        ) : state?.upgradedAt ? (
                          <div className="upgrade-info">
                            <span className="upgrade-info__block">{formatBlockNumber(state.upgradedAt.blockNumber)}</span>
                            <span className="upgrade-info__time">
                              {formatLocalTime(state.upgradedAt.timestampMs)} | {formatRelativeTime(state.upgradedAt.timestampMs)}
                            </span>
                          </div>
                        ) : (
                          'Loading…'
                        )}
                      </td>
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
