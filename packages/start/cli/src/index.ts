import { readFile } from 'fs/promises'
import { join as pathJoin, resolve as pathResolve } from 'path'
import readline from 'readline'
import { startThreadPool } from '@tpool/server'
import dotenv from 'dotenv'
import type { TPackageJson } from 'pkgu'
import { startTimeMs } from 'takes'
import { once } from 'wans'

type TStartOptions = {
  tasks: string,
  reporter?: string,
  require?: (string | [string, { [k: string]: any }])[],
}

try {
  const endTimeMs = startTimeMs()

  dotenv.config()

  const packageJsonPath = pathJoin(process.cwd(), 'package.json')
  const packageJsonData = await readFile(packageJsonPath, 'utf8')
  const packageJson = JSON.parse(packageJsonData) as TPackageJson & { start: TStartOptions }
  const tasksFilePath = pathResolve(packageJson.start.tasks)
  const tasksExported = await import(tasksFilePath)
  const taskNames = Object.keys(tasksExported)

  console.log('tasks:', taskNames)

  const stopThreadPool1 = await startThreadPool({
    threadCount: 8,
    url: 'ws+unix:///tmp/start1.sock',
  })
  // const stopThreadPool2 = await startThreadPool({
  //   threadCount: 4,
  //   url: 'ws://localhost:8000',
  //   // tls: {
  //   //   cert: await readFile(process.env.START_WSS_POOL_CERT!),
  //   //   key: await readFile(process.env.START_WSS_POOL_KEY!),
  //   // },
  // })

  const tookMs = endTimeMs()

  console.log('time:', `${tookMs}ms`)

  const autocomplete = taskNames.concat('/tasks', '/quit')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    tabSize: 4,
    prompt: '> ',
    completer: (input: string) => [
      autocomplete.filter((item) => item.startsWith(input)),
      input,
    ],
  })

  while (true) {
    rl.prompt()

    const input = await once<string>(rl, 'line')

    if (input === '/tasks') {
      console.log('tasks:', taskNames)

      continue
    }

    if (input === '/quit') {
      rl.close()

      await stopThreadPool1()
      // await stopThreadPool2()

      console.log('bye')

      break
    }

    if (!autocomplete.includes(input)) {
      console.error(`unknown: ${input}`)

      continue
    }

    const taskRunner = await tasksExported[input]()
    const taskIterable = await taskRunner()

    try {
      const endTimeMs = startTimeMs()
      let i = 0

      for await (const _ of taskIterable) {
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(`items: ${++i}`)
        // console.log(i.path)
      }

      process.stdout.write('\n')

      const tookMs = endTimeMs()

      console.log(`time: ${tookMs}ms`)
    } catch (err) {
      console.error(err)
    }
  }
} catch (err) {
  console.error(err)
  process.exit(1)
}
