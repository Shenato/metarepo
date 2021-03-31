import type { TFile, TPlugin, TTask } from './types'

const buildIt = (outDir: string): TPlugin<string, TFile> => async function* (it) {
  const { pipe } = await import('funcom')
  const { read } = await import('./read')
  const { babel } = await import('./babel')
  const { babelConfigBuildNode } = await import('./babel-config')
  const { rename } = await import('./rename')
  const { write } = await import('./write')

  yield* pipe(
    read,
    babel(babelConfigBuildNode),
    rename(/\.tsx?$/, '.js'),
    write(outDir)
  )(it)
}

export const buildNode: TTask<string, TFile> = async function* (pkg) {
  const { pipe } = await import('funcom')
  const { find } = await import('./find')
  const { remove } = await import('./remove')
  const { mapThreadPool } = await import('@start/thread-pool')

  const outDir = `packages/${pkg}/build/node/`

  yield* pipe(
    find(outDir),
    remove,
    find(`packages/${pkg}/src/*.ts`),
    // buildIt(outDir)
    mapThreadPool(buildIt, outDir, { groupBy: 8 })
  )()
}
