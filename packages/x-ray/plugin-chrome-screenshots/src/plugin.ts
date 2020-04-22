import { runChromium } from 'xrom'
import { workerama } from 'workerama'
import { forEachAsync, toMapAsync } from 'iterama'
import { pipe } from 'funcom'
import { TPlugin } from '@x-ray/core'
import { TCheckOptions, TWorkerResult } from './types'
import { MAX_THREAD_COUNT, WORKER_PATH } from './constants'

export type TChromeScreenshotsOptions = {
  fontsDir?: string,
  shouldBailout?: boolean,
}

export const chromeScreenshots = (options?: TChromeScreenshotsOptions): TPlugin<Uint8Array> => ({
  name: 'chrome-screenshots',
  encoding: 'image',
  getResults: async (files) => {
    const opts = {
      shouldBailout: false,
      ...options,
    }
    const browserWSEndpoint = await runChromium({
      shouldCloseOnExit: true,
      fontsDir: opts?.fontsDir,
    })
    const checkOptions: TCheckOptions = {
      browserWSEndpoint,
      dpr: 2,
      shouldBailout: opts.shouldBailout,
    }

    const totalResultsIterable = workerama<TWorkerResult<Uint8Array>>({
      items: files,
      maxThreadCount: MAX_THREAD_COUNT,
      fnFilePath: WORKER_PATH,
      fnName: 'check',
      fnArgs: [checkOptions],
    })

    return pipe(
      forEachAsync(([filePath]: TWorkerResult<Uint8Array>) => console.log(filePath)),
      toMapAsync
    )(totalResultsIterable)
  },
})
