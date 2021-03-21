import path from 'path'
import { fileURLToPath } from 'url'
import { Worker } from 'worker_threads'
import { pipe } from 'funcom'
import getCallerFile from 'get-caller-file'
import { mapAsync } from 'iterama'
import { piAllAsync } from 'piall'
import type { TJsonValue } from 'typeon'
import { once } from 'wans'
import { groupByAsync } from './group-by-async'
import { resolve } from './resolve'
import { startWithTypeAsync } from './start-with-type-async'
import type { TPipePoolOptions, TStartPoolOptions, TMessageToWorker, TMessageFromWorker } from './types'
import { ungroupAsync } from './ungroup-async'

const DEFAULT_GROUP_BY = 8
const DEFAULT_GROUP_TYPE = 'serial'

let workers: Worker[] = []
const busyWorkers = new Set<number>()

export const startThreadPool = async (options: TStartPoolOptions): Promise<() => Promise<number[]>> => {
  const workerPath = await resolve('./worker-wrapper.mjs')

  workers = await Promise.all(
    Array.from({ length: options.threadCount }, async () => {
      const worker = new Worker(workerPath, {
        trackUnmanagedFds: true,
      })

      await once(worker, 'online')

      return worker
    })
  )

  console.log('threads:', options.threadCount)

  return () => Promise.all(
    workers.map((worker) => worker.terminate())
  )
}

export const pipeThreadPool = <T extends TJsonValue, R extends TJsonValue>(taskFn: (arg: any) => (it: AsyncIterable<T>) => Promise<AsyncIterable<R>>, arg: TJsonValue, options?: TPipePoolOptions) => {
  if (workers.length === 0) {
    throw new Error('Start thread pool first')
  }

  const callerDir = fileURLToPath(path.dirname(getCallerFile()))
  const taskString = taskFn.toString()
  const groupBy = options?.groupBy ?? DEFAULT_GROUP_BY
  const groupType = options?.groupType ?? DEFAULT_GROUP_TYPE

  return (it: AsyncIterable<T>): AsyncIterable<R> => {
    const mapper = (group: T[]) => async (): Promise<R[]> => {
      const worker = workers.find((worker) => !busyWorkers.has(worker.threadId))!

      busyWorkers.add(worker.threadId)

      const messageToWorker: TMessageToWorker = {
        taskString,
        arg,
        callerDir,
        group,
        groupBy,
        groupType,
      }

      worker.postMessage(messageToWorker)

      const messageFromWorker = await once<TMessageFromWorker<R[]>>(worker, 'message')

      busyWorkers.delete(worker.threadId)

      if (messageFromWorker.type === 'ERROR') {
        throw messageFromWorker.value
      }

      return messageFromWorker.value
    }

    return pipe(
      startWithTypeAsync<T>(),
      groupByAsync(groupBy),
      mapAsync(mapper),
      piAllAsync(workers.length),
      ungroupAsync
    )(it)
  }
}
