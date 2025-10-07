import type { ApiPromise } from '@polkadot/api'

export type UpgradeInfo = {
  blockNumber: number
  timestampMs: number
}

export const SPEC_UPGRADE_STORAGE_KEY = 'polkadot-utils:spec-upgrades'

export const getSpecUpgradeStorageKey = (networkId: string) => `${SPEC_UPGRADE_STORAGE_KEY}:${networkId}`

export type SpecUpgradeSearchProgress = {
  attempts: number
  estimatedTotal: number
  lowerBound: number
  upperBound: number
  midpoint: number
}

type BigIntLikeCodec = {
  toBigInt: () => bigint
}

const hasToBigInt = (value: unknown): value is BigIntLikeCodec => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return typeof Reflect.get(value, 'toBigInt') === 'function'
}

export const estimateSpecUpgradeSearchSteps = (currentBlockNumber: number) => {
  if (!Number.isFinite(currentBlockNumber) || currentBlockNumber <= 0) {
    return 1
  }
  const rangeSize = Math.max(1, currentBlockNumber + 1)
  return Math.max(1, Math.ceil(Math.log2(rangeSize)) + 1)
}

export const isValidUpgradeInfo = (value: unknown): value is UpgradeInfo => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Partial<UpgradeInfo>
  return (
    typeof candidate.blockNumber === 'number' &&
    Number.isFinite(candidate.blockNumber) &&
    typeof candidate.timestampMs === 'number' &&
    Number.isFinite(candidate.timestampMs)
  )
}

export const readTimestampMs = async (api: ApiPromise, blockHash: string) => {
  const moment = await api.query.timestamp.now.at(blockHash)
  if (!moment) {
    throw new Error('Timestamp value not available')
  }

  if (!hasToBigInt(moment)) {
    throw new Error('Timestamp codec does not support bigint conversion')
  }

  const milliseconds = Number(moment.toBigInt())
  if (!Number.isFinite(milliseconds)) {
    throw new Error('Timestamp value is out of range')
  }

  return milliseconds
}

export const readSpecVersion = async (api: ApiPromise, blockHash: string) => {
  const runtimeVersion = await api.rpc.state.getRuntimeVersion(blockHash)
  const specVersion = runtimeVersion.specVersion.toNumber()
  if (!Number.isFinite(specVersion)) {
    throw new Error('Spec version is out of range')
  }
  return specVersion
}

export const formatLocalTime = (timestampMs: number | undefined) => {
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

export const formatBlockNumber = (blockNumber: number | undefined) => {
  if (blockNumber == null) {
    return 'Loading…'
  }
  return blockNumber.toLocaleString()
}

export const formatSpecVersion = (specVersion: number | undefined) => {
  if (specVersion == null) {
    return 'Loading…'
  }
  return specVersion.toString()
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
const RELATIVE_TIME_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: 'week', ms: 1000 * 60 * 60 * 24 * 7 },
  { unit: 'day', ms: 1000 * 60 * 60 * 24 },
  { unit: 'hour', ms: 1000 * 60 * 60 },
  { unit: 'minute', ms: 1000 * 60 },
  { unit: 'second', ms: 1000 },
]

export const formatRelativeTime = (timestampMs: number | undefined) => {
  if (timestampMs == null) {
    return 'Loading…'
  }

  const now = Date.now()
  const diff = timestampMs - now
  const absDiff = Math.abs(diff)

  if (absDiff < 45_000) {
    return 'just now'
  }

  for (const { unit, ms } of RELATIVE_TIME_UNITS) {
    if (absDiff >= ms || unit === 'second') {
      const value = Math.round(diff / ms)
      if (value === 0) {
        return 'just now'
      }
      return relativeTimeFormatter.format(value, unit)
    }
  }

  return 'just now'
}

export const findSpecUpgradeBlock = async (
  api: ApiPromise,
  currentBlockNumber: number,
  specVersion: number,
  onProgress?: (progress: SpecUpgradeSearchProgress) => void,
): Promise<UpgradeInfo> => {
  let low = 0
  let high = currentBlockNumber
  let result = currentBlockNumber
  const specVersionByBlock = new Map<number, number>([[currentBlockNumber, specVersion]])
  const estimatedTotal = estimateSpecUpgradeSearchSteps(currentBlockNumber)
  let attempts = 0

  const getSpecVersionForBlock = async (blockNumber: number): Promise<number> => {
    const cached = specVersionByBlock.get(blockNumber)
    if (cached != null) {
      return cached
    }

    const blockHash = await api.rpc.chain.getBlockHash(blockNumber)
    const version = await readSpecVersion(api, blockHash.toHex())
    specVersionByBlock.set(blockNumber, version)
    return version
  }

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    attempts += 1
    onProgress?.({
      attempts,
      estimatedTotal,
      lowerBound: low,
      upperBound: high,
      midpoint: mid,
    })
    const midSpecVersion = await getSpecVersionForBlock(mid)

    if (midSpecVersion >= specVersion) {
      if (midSpecVersion === specVersion) {
        result = mid
      }
      high = mid - 1
    } else {
      low = mid + 1
    }
  }

  const resultHash = await api.rpc.chain.getBlockHash(result)
  const timestampMs = await readTimestampMs(api, resultHash.toHex())

  return {
    blockNumber: result,
    timestampMs,
  }
}
