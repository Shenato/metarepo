import type { TFile, TTask, TNoInputTask } from './types'

const buildIt = (dir: string): TTask<string, TFile> => async (it) => {
  const { pipeAsync } = await import('funcom')
  const { read } = await import('./read')
  const { rename } = await import('./rename')
  const { babel } = await import('./babel')
  const { babelConfigBuildNode } = await import('./babel-config')
  const { write } = await import('./write')

  return pipeAsync(
    read,
    babel(babelConfigBuildNode),
    rename((path) => path.replace(/\.tsx?$/, '.js')),
    write(dir)
  )(it)
}

export const build: TNoInputTask<TFile> = async () => {
  const { pipeAsync } = await import('funcom')
  const { pipeThreadPool } = await import('@tpool/client')
  const { find } = await import('./find')
  const { remove } = await import('./remove')

  const outDir = 'packages/iterama/build/'

  return pipeAsync(
    find([outDir]),
    remove,
    find(['packages/iterama/src/*.ts']),
    // buildIt(outDir),
    pipeThreadPool(
      buildIt,
      outDir,
      {
        groupBy: 8,
        groupType: 'serial',
        pools: [
          'ws+unix:///tmp/start1.sock',
          'ws://localhost:8000',
        ],
      }
    )
  )()
}
