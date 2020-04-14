import { access } from 'pifs'
import { TarFs, TTarFs } from '@x-ray/tar-fs'
import { TJsonValue } from 'typeon'
import { map, toMapAsync } from 'iterama'
import { piAll } from 'piall'
import serialize from '@x-ray/serialize-react-tree'
import { getTarFilePath } from '../utils/get-tar-file-path'
import { TExample, TCheckResult } from '../types'
import { hasSnapshotDiff } from '../utils/has-snapshot-diff'
import { TWorkerResultInternal } from './types'
import { SCREENSHOTS_PER_WORKER_COUNT } from './constants'
import { getSnapshotDimensions } from './get-snapshot-dimensions'

export const check = () => {
  // stop using internal pool and allocate memory every time
  // because we transfer underlying memory from worker, and hopefully
  // it's faster than copying a lot of buffers from worker to parent
  //
  // otherwise it leads to `Cannot perform Construct on a neutered ArrayBuffer` error
  Buffer.poolSize = 0

  return async (filePath: string): Promise<TWorkerResultInternal<Buffer>> => {
    const tarFilePath = getTarFilePath(filePath, 'chrome')
    let tarFs = null as null | TTarFs

    try {
      await access(tarFilePath)

      tarFs = await TarFs(tarFilePath)
    } catch {}

    const { examples } = await import(filePath) as { examples: Iterable<TExample> }
    const transferList = [] as ArrayBuffer[]
    const status = {
      ok: 0,
      new: 0,
      diff: 0,
      deleted: 0,
    }
    // const results: TCheckResults<Buffer> = new Map()

    const asyncIterable = piAll(
      map((example: TExample) => async (): Promise<[string, TCheckResult<Buffer>]> => {
        const newSnapshot = serialize(example.element)
        const newSnapshotBuffer = Buffer.from(newSnapshot)

        // NEW
        if (tarFs === null || !tarFs.has(example.id)) {
          const { width, height } = getSnapshotDimensions(newSnapshot)

          transferList.push(newSnapshotBuffer)

          status.new++

          return [example.id, {
            type: 'NEW',
            meta: example.meta,
            data: newSnapshotBuffer,
            width,
            height,
          }]
        }

        const origSnapshotBuffer = await tarFs.read(example.id) as Buffer

        // DIFF
        if (hasSnapshotDiff(newSnapshotBuffer, origSnapshotBuffer)) {
          const { width: origWidth, height: origHeight } = getSnapshotDimensions(origSnapshotBuffer.toString('utf8'))
          const { width: newWidth, height: newHeight } = getSnapshotDimensions(newSnapshot)

          transferList.push(newSnapshotBuffer, origSnapshotBuffer)

          status.diff++

          return [example.id, {
            type: 'DIFF',
            origData: origSnapshotBuffer,
            origWidth,
            origHeight,
            newData: newSnapshotBuffer,
            newWidth,
            newHeight,
            meta: example.meta,
          }]
        }

        // OK
        status.ok++

        return [example.id, {
          type: 'OK',
        }]
      })(examples),
      SCREENSHOTS_PER_WORKER_COUNT
    )

    const results = await toMapAsync(asyncIterable)

    // DELETED
    if (tarFs !== null) {
      for (const id of tarFs.list()) {
        if (id.endsWith('-meta')) {
          continue
        }

        if (!results.has(id)) {
          const deletedSnapshotBuffer = await tarFs.read(id) as Buffer
          const deletedSnapshot = deletedSnapshotBuffer.toString('utf8')
          const { width, height } = getSnapshotDimensions(deletedSnapshot)
          const metaId = `${id}-meta`
          let meta

          if (tarFs.has(metaId)) {
            const metaBuffer = await tarFs.read(id) as Buffer

            meta = JSON.parse(metaBuffer.toString('utf8')) as TJsonValue
          }

          transferList.push(deletedSnapshotBuffer)

          results.set(id, {
            type: 'DELETED',
            data: deletedSnapshotBuffer,
            meta,
            width,
            height,
          })

          status.deleted++
        }
      }

      await tarFs.close()
    }

    return {
      value: [filePath, { results, status }],
      transferList,
    }
  }
}
