import { ApiPromise, WsProvider } from '@polkadot/api'

export type NetworkFamily = 'polkadot' | 'kusama'
type NetworkCategory = 'relay' | 'parachain'

type NetworkDefinition = {
  id: string
  label: string
  family: NetworkFamily
  category: NetworkCategory
  endpoints: readonly string[]
}

const polkadotRelayNetworks = [
  {
    id: 'polkadot',
    label: 'Polkadot',
    family: 'polkadot',
    category: 'relay',
    endpoints: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://1rpc.io/dot',
      'wss://dot-rpc.stakeworld.io',
    ] as const,
  },
] as const satisfies ReadonlyArray<NetworkDefinition>

const polkadotParachainNetworks = [
  {
    id: 'polkadot_asset_hub',
    label: 'Asset Hub',
    family: 'polkadot',
    category: 'parachain',
    endpoints: [
      'wss://polkadot-asset-hub-rpc.polkadot.io',
      'wss://asset-hub-polkadot-rpc.n.dwellir.com',
      'wss://asset-hub-polkadot.dotters.network',
      'wss://rpc-asset-hub-polkadot.luckyfriday.io',
      'wss://statemint.api.onfinality.io/public-ws',
    ] as const,
  },
  {
    id: 'polkadot_bridge_hub',
    label: 'Bridge Hub',
    family: 'polkadot',
    category: 'parachain',
    endpoints: [
      'wss://polkadot-bridge-hub-rpc.polkadot.io',
      'wss://bridge-hub-polkadot-rpc.n.dwellir.com',
      'wss://bridge-hub-polkadot.dotters.network',
      'wss://rpc-bridge-hub-polkadot.luckyfriday.io',
    ] as const,
  },
  {
    id: 'polkadot_collectives',
    label: 'Collectives',
    family: 'polkadot',
    category: 'parachain',
    endpoints: [
      'wss://polkadot-collectives-rpc.polkadot.io',
      'wss://collectives-polkadot-rpc.n.dwellir.com',
      'wss://collectives-polkadot.dotters.network',
      'wss://rpc-collectives-polkadot.luckyfriday.io',
      'wss://collectives.api.onfinality.io/public-ws',
    ] as const,
  },
  {
    id: 'polkadot_coretime',
    label: 'Coretime',
    family: 'polkadot',
    category: 'parachain',
    endpoints: [
      'wss://polkadot-coretime-rpc.polkadot.io',
      'wss://coretime-polkadot-rpc.n.dwellir.com',
      'wss://coretime-polkadot.dotters.network',
      'wss://rpc-coretime-polkadot.luckyfriday.io',
    ] as const,
  },
  {
    id: 'polkadot_people',
    label: 'People',
    family: 'polkadot',
    category: 'parachain',
    endpoints: [
      'wss://polkadot-people-rpc.polkadot.io',
      'wss://people-polkadot-rpc.n.dwellir.com',
      'wss://people-polkadot.dotters.network',
      'wss://rpc-people-polkadot.luckyfriday.io',
      'wss://people-polkadot.api.onfinality.io/public-ws',
      'wss://dot-rpc.stakeworld.io/people',
    ] as const,
  },
  {
    id: 'acala',
    label: 'Acala',
    family: 'polkadot',
    category: 'parachain',
    endpoints: [
      'wss://acala-rpc-0.aca-api.network',
      'wss://acala-rpc-1.aca-api.network',
      'wss://acala-rpc-3.aca-api.network/ws',
      'wss://acala-rpc.n.dwellir.com',
      'wss://acala.ibp.network',
      'wss://acala.dotters.network',
    ] as const,
  },
  {
    id: 'ajuna',
    label: 'Ajuna Network',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://rpc-para.ajuna.network', 'wss://ajuna.ibp.network', 'wss://ajuna.dotters.network'] as const,
  },
  {
    id: 'astar',
    label: 'Astar',
    family: 'polkadot',
    category: 'parachain',
    endpoints: [
      'wss://rpc.astar.network',
      'wss://astar.public.blastapi.io',
      'wss://astar-rpc.n.dwellir.com',
      'wss://astar.api.onfinality.io/public-ws',
      'wss://astar.public.curie.radiumblock.co/ws',
    ] as const,
  },
  {
    id: 'aventus',
    label: 'Aventus',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://public-rpc.mainnet.aventus.io'] as const,
  },
  {
    id: 'bifrost_polkadot',
    label: 'Bifrost',
    family: 'polkadot',
    category: 'parachain',
    endpoints: [
      'wss://bifrost-polkadot.ibp.network',
      'wss://bifrost-polkadot.dotters.network',
      'wss://hk.p.bifrost-rpc.liebi.com/ws',
      'wss://eu.bifrost-polkadot-rpc.liebi.com/ws',
    ] as const,
  },
  {
    id: 'centrifuge',
    label: 'Centrifuge',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://rpc-centrifuge.luckyfriday.io', 'wss://centrifuge-parachain.api.onfinality.io/public-ws'] as const,
  },
  {
    id: 'crust',
    label: 'Crust',
    family: 'polkadot',
    category: 'parachain',
    endpoints: [
      'wss://crust-parachain.crustapps.net',
      'wss://crust-parachain.crustnetwork.app',
      'wss://crust-parachain.crustnetwork.cc',
      'wss://crust-parachain.crustnetwork.xyz',
    ] as const,
  },
  {
    id: 'darwinia',
    label: 'Darwinia',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://rpc.darwinia.network', 'wss://darwinia-rpc.n.dwellir.com', 'wss://darwinia.rpc.subquery.network/public/ws'] as const,
  },
  {
    id: 'energy_web_x',
    label: 'Energy Web X',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://public-rpc.mainnet.energywebx.com/'] as const,
  },
  {
    id: 'frequency',
    label: 'Frequency',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://0.rpc.frequency.xyz', 'wss://1.rpc.frequency.xyz', 'wss://frequency-polkadot.api.onfinality.io/public-ws'] as const,
  },
  {
    id: 'heima',
    label: 'Heima',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://heima-rpc.n.dwellir.com', 'wss://rpc.heima-parachain.heima.network'] as const,
  },
  {
    id: 'hydration',
    label: 'Hydration',
    family: 'polkadot',
    category: 'parachain',
    endpoints: [
      'wss://hydration-rpc.n.dwellir.com',
      'wss://rpc.hydradx.cloud',
      'wss://rpc.helikon.io/hydradx',
      'wss://hydration.ibp.network',
      'wss://hydration.dotters.network',
    ] as const,
  },
  {
    id: 'hyperbridge_nexus',
    label: 'Hyperbridge (Nexus)',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://hyperbridge-nexus-rpc.blockops.network', 'wss://nexus.ibp.network', 'wss://nexus.dotters.network'] as const,
  },
  {
    id: 'integritee_polkadot',
    label: 'Integritee',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://polkadot.api.integritee.network'] as const,
  },
  {
    id: 'interlay',
    label: 'Interlay',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://api.interlay.io/parachain', 'wss://rpc-interlay.luckyfriday.io/'] as const,
  },
  {
    id: 'jamton',
    label: 'JAMTON',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://rpc.jamton.network'] as const,
  },
  {
    id: 'kilt_spiritnet',
    label: 'KILT Spiritnet',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://kilt.ibp.network', 'wss://kilt.dotters.network', 'wss://spiritnet.kilt.io/'] as const,
  },
  {
    id: 'laos',
    label: 'Laos',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://rpc.laos.laosfoundation.io'] as const,
  },
  {
    id: 'logion',
    label: 'Logion',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://para-rpc01.logion.network'] as const,
  },
  {
    id: 'manta',
    label: 'Manta',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://ws.manta.systems'] as const,
  },
  {
    id: 'moonbeam',
    label: 'Moonbeam',
    family: 'polkadot',
    category: 'parachain',
    endpoints: [
      'wss://moonbeam-rpc.publicnode.com',
      'wss://moonbeam.public.blastapi.io',
      'wss://moonbeam-rpc.n.dwellir.com',
      'wss://moonbeam.ibp.network',
      'wss://moonbeam.dotters.network',
      'wss://wss.api.moonbeam.network',
      'wss://moonbeam.api.onfinality.io/public-ws',
      'wss://moonbeam.public.curie.radiumblock.co/ws',
      'wss://moonbeam.unitedbloc.com',
    ] as const,
  },
  {
    id: 'pendulum',
    label: 'Pendulum',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://rpc-pendulum.prd.pendulumchain.tech'] as const,
  },
  {
    id: 'phala',
    label: 'Phala',
    family: 'polkadot',
    category: 'parachain',
    endpoints: [
      'wss://phala-rpc.n.dwellir.com',
      'wss://rpc.helikon.io/phala',
      'wss://phala.api.onfinality.io/public-ws',
      'wss://phala.public.curie.radiumblock.co/ws',
    ] as const,
  },
  {
    id: 'robonomics_polkadot',
    label: 'Robonomics',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://polkadot.rpc.robonomics.network/'] as const,
  },
  {
    id: 'sora',
    label: 'SORA',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://ws.parachain-collator-3.pc3.sora2.soramitsu.co.jp'] as const,
  },
  {
    id: 'unique',
    label: 'Unique Network',
    family: 'polkadot',
    category: 'parachain',
    endpoints: [
      'wss://ws.unique.network',
      'wss://unique.ibp.network',
      'wss://unique.dotters.network',
      'wss://us-ws.unique.network',
      'wss://asia-ws.unique.network',
      'wss://eu-ws.unique.network',
    ] as const,
  },
  {
    id: 'zeitgeist',
    label: 'Zeitgeist',
    family: 'polkadot',
    category: 'parachain',
    endpoints: ['wss://zeitgeist.api.onfinality.io/public-ws'] as const,
  },
] as const satisfies ReadonlyArray<NetworkDefinition>

const kusamaRelayNetworks = [
  {
    id: 'kusama',
    label: 'Kusama',
    family: 'kusama',
    category: 'relay',
    endpoints: [
      'wss://kusama-rpc.polkadot.io',
      'wss://kusama.api.onfinality.io/public-ws',
      'wss://1rpc.io/ksm',
      'wss://kusama.public.curie.radiumblock.co/ws',
    ] as const,
  },
] as const satisfies ReadonlyArray<NetworkDefinition>

const kusamaParachainNetworks = [
  {
    id: 'kusama_asset_hub',
    label: 'Asset Hub',
    family: 'kusama',
    category: 'parachain',
    endpoints: [
      'wss://asset-hub-kusama-rpc.polkadot.io',
      'wss://asset-hub-kusama-rpc.n.dwellir.com',
      'wss://assethub-kusama.dotters.network',
      'wss://rpc-asset-hub-kusama.luckyfriday.io',
      'wss://statemine.api.onfinality.io/public-ws',
    ] as const,
  },
  {
    id: 'kusama_bridge_hub',
    label: 'Bridge Hub',
    family: 'kusama',
    category: 'parachain',
    endpoints: [
      'wss://bridge-hub-kusama-rpc.polkadot.io',
      'wss://bridge-hub-kusama-rpc.n.dwellir.com',
      'wss://bridge-hub-kusama.dotters.network',
      'wss://rpc-bridge-hub-kusama.luckyfriday.io',
    ] as const,
  },
  {
    id: 'kusama_coretime',
    label: 'Coretime',
    family: 'kusama',
    category: 'parachain',
    endpoints: [
      'wss://coretime-kusama-rpc.polkadot.io',
      'wss://coretime-kusama-rpc.n.dwellir.com',
      'wss://coretime-kusama.dotters.network',
      'wss://rpc-coretime-kusama.luckyfriday.io',
    ] as const,
  },
  {
    id: 'kusama_people',
    label: 'People',
    family: 'kusama',
    category: 'parachain',
    endpoints: [
      'wss://people-kusama-rpc.polkadot.io',
      'wss://people-kusama-rpc.n.dwellir.com',
      'wss://people-kusama.dotters.network',
      'wss://rpc-people-kusama.luckyfriday.io',
    ] as const,
  },
  {
    id: 'acurast',
    label: 'Acurast Canary',
    family: 'kusama',
    category: 'parachain',
    endpoints: ['wss://public-rpc.canary.acurast.com'] as const,
  },
  {
    id: 'altair',
    label: 'Altair',
    family: 'kusama',
    category: 'parachain',
    endpoints: ['wss://altair.api.onfinality.io/public-ws'] as const,
  },
  {
    id: 'amplitude',
    label: 'Amplitude',
    family: 'kusama',
    category: 'parachain',
    endpoints: ['wss://rpc-amplitude.pendulumchain.tech'] as const,
  },
  {
    id: 'basilisk',
    label: 'Basilisk',
    family: 'kusama',
    category: 'parachain',
    endpoints: ['wss://rpc.basilisk.cloud', 'wss://basilisk-rpc.n.dwellir.com'] as const,
  },
  {
    id: 'bifrost_kusama',
    label: 'Bifrost',
    family: 'kusama',
    category: 'parachain',
    endpoints: ['wss://bifrost-rpc.liebi.com/ws', 'wss://us.bifrost-rpc.liebi.com/ws'] as const,
  },
  {
    id: 'crab',
    label: 'Crab',
    family: 'kusama',
    category: 'parachain',
    endpoints: ['wss://crab-rpc.darwinia.network/', 'wss://darwiniacrab-rpc.n.dwellir.com'] as const,
  },
  {
    id: 'crust_shadow',
    label: 'Crust Shadow',
    family: 'kusama',
    category: 'parachain',
    endpoints: [
      'wss://rpc-shadow.crust.network/',
      'wss://rpc-shadow.crustnetwork.app',
      'wss://rpc-shadow.crustnetwork.cc',
      'wss://rpc-shadow.crustnetwork.xyz',
    ] as const,
  },
  {
    id: 'dao_ipci',
    label: 'DAO IPCI',
    family: 'kusama',
    category: 'parachain',
    endpoints: ['wss://ipci.rpc.robonomics.network'] as const,
  },
  {
    id: 'integritee_kusama',
    label: 'Integritee',
    family: 'kusama',
    category: 'parachain',
    endpoints: ['wss://kusama.api.integritee.network', 'wss://integritee-kusama.api.onfinality.io/public-ws'] as const,
  },
  {
    id: 'kabocha',
    label: 'Kabocha',
    family: 'kusama',
    category: 'parachain',
    endpoints: ['wss://kabocha.jelliedowl.net'] as const,
  },
  {
    id: 'karura',
    label: 'Karura',
    family: 'kusama',
    category: 'parachain',
    endpoints: [
      'wss://karura-rpc-0.aca-api.network',
      'wss://karura-rpc-1.aca-api.network',
      'wss://karura-rpc-2.aca-api.network/ws',
      'wss://karura-rpc-3.aca-api.network/ws',
      'wss://karura-rpc.n.dwellir.com',
    ] as const,
  },
  {
    id: 'kintsugi',
    label: 'Kintsugi BTC',
    family: 'kusama',
    category: 'parachain',
    endpoints: ['wss://api-kusama.interlay.io/parachain', 'wss://kintsugi.api.onfinality.io/public-ws'] as const,
  },
  {
    id: 'kreivo',
    label: 'Kreivo',
    family: 'kusama',
    category: 'parachain',
    endpoints: ['wss://kreivo.kippu.rocks/'] as const,
  },
  {
    id: 'krest',
    label: 'Krest',
    family: 'kusama',
    category: 'parachain',
    endpoints: ['wss://wss-krest.peaq.network/', 'wss://krest.api.onfinality.io/public-ws'] as const,
  },
  {
    id: 'moonriver',
    label: 'Moonriver',
    family: 'kusama',
    category: 'parachain',
    endpoints: [
      'wss://moonriver-rpc.publicnode.com',
      'wss://moonriver-rpc.n.dwellir.com',
      'wss://wss.api.moonriver.moonbeam.network',
      'wss://moonriver.api.onfinality.io/public-ws',
      'wss://moonriver.public.curie.radiumblock.co/ws',
      'wss://moonriver.unitedbloc.com',
    ] as const,
  },
  {
    id: 'robonomics_kusama',
    label: 'Robonomics',
    family: 'kusama',
    category: 'parachain',
    endpoints: ['wss://kusama.rpc.robonomics.network/'] as const,
  },
  {
    id: 'shiden',
    label: 'Shiden',
    family: 'kusama',
    category: 'parachain',
    endpoints: [
      'wss://rpc.shiden.astar.network',
      'wss://shiden-rpc.n.dwellir.com',
      'wss://shiden.api.onfinality.io/public-ws',
      'wss://shiden.public.curie.radiumblock.co/ws',
    ] as const,
  },
  {
    id: 'sora_kusama',
    label: 'SORA',
    family: 'kusama',
    category: 'parachain',
    endpoints: ['wss://ws.parachain-collator-2.c2.sora2.soramitsu.co.jp'] as const,
  },
] as const satisfies ReadonlyArray<NetworkDefinition>

export const networkDefinitions = [
  ...polkadotRelayNetworks,
  ...polkadotParachainNetworks,
  ...kusamaRelayNetworks,
  ...kusamaParachainNetworks,
] as const satisfies ReadonlyArray<NetworkDefinition>

export type NetworkId = (typeof networkDefinitions)[number]['id']

export const networkGroups = [
  {
    id: 'polkadot',
    label: 'Polkadot',
    members: networkDefinitions.filter((network) => network.family === 'polkadot' && network.category === 'relay'),
  },
  {
    id: 'polkadot-parachains',
    label: 'Polkadot Parachains',
    members: networkDefinitions.filter((network) => network.family === 'polkadot' && network.category === 'parachain'),
  },
  {
    id: 'kusama',
    label: 'Kusama',
    members: networkDefinitions.filter((network) => network.family === 'kusama' && network.category === 'relay'),
  },
  {
    id: 'kusama-parachains',
    label: 'Kusama Parachains',
    members: networkDefinitions.filter((network) => network.family === 'kusama' && network.category === 'parachain'),
  },
] as const

const definitionById = new Map(networkDefinitions.map((network) => [network.id, network]))

type ApiCacheEntry = {
  promise: Promise<ApiPromise>
  provider: WsProvider
}

const apiCache = new Map<NetworkId, ApiCacheEntry>()

const getNetwork = (id: NetworkId) => {
  const definition = definitionById.get(id)
  if (!definition) {
    throw new Error(`Unknown network ${id}`)
  }
  return definition
}

export const getApi = (id: NetworkId): Promise<ApiPromise> => {
  const cached = apiCache.get(id)
  if (cached) {
    return cached.promise
  }

  const network = getNetwork(id)
  const provider = new WsProvider([...network.endpoints])
  const promise = ApiPromise.create({ provider }).then(async (api) => {
    await api.isReady
    return api
  })

  apiCache.set(id, { promise, provider })

  promise.catch((error) => {
    provider.disconnect().catch(() => {
      // ignore disconnect errors
    })
    const current = apiCache.get(id)
    if (current?.promise === promise) {
      apiCache.delete(id)
    }
    throw error
  })

  return promise
}

export const refreshApi = async (id: NetworkId): Promise<ApiPromise> => {
  const cached = apiCache.get(id)
  if (cached) {
    apiCache.delete(id)
    try {
      const api = await cached.promise
      await api.disconnect()
    } catch (_error) {
      cached.provider.disconnect().catch(() => {
        // ignore disconnect errors
      })
    }
  }

  return getApi(id)
}
