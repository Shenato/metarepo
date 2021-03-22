#!/bin/sh
//bin/sh -c :; exec /usr/bin/env node --require @nextools/suppress-experimental-warnings --experimental-import-meta-resolve --experimental-loader @nextools/typescript-esm-loader "$0" "$@"
// https://unix.stackexchange.com/questions/65235/universal-node-js-shebang#comment755057_65295

import { readFile } from 'fs/promises'
import { join as pathJoin, resolve as pathResolve } from 'path'
import readline from 'readline'
import { startThreadPool } from '@start/thread-pool'
// import dotenv from 'dotenv'
import type { TPackageJson } from 'pkgu'
import { startTimeMs } from 'takes'
import { once } from 'wans'

type TTasks = {
  [key: string]: (...args: string[]) => () => Promise<AsyncIterable<any>>,
}

type TStartOptions = {
  tasks: string,
  reporter?: string,
  require?: (string | [string, { [k: string]: any }])[],
}

try {
  const endTimeMs = startTimeMs()

  // dotenv.config()

  const packageJsonPath = pathJoin(process.cwd(), 'package.json')
  const packageJsonData = await readFile(packageJsonPath, 'utf8')
  const packageJson = JSON.parse(packageJsonData) as TPackageJson & { start: TStartOptions }
  const tasksFilePath = pathResolve(packageJson.start.tasks)
  const tasksExported = await import(tasksFilePath) as TTasks
  const taskNames = Object.keys(tasksExported)

  console.log('tasks:', taskNames)

  const stopThreadPool = await startThreadPool({
    threadCount: 8,
  })

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

  rl.once('SIGINT', () => {
    process.exit()
  })

  while (true) {
    rl.prompt()

    const input = await once<string>(rl, 'line')

    if (input.length === 0) {
      continue
    }

    if (input === '/tasks') {
      console.log('tasks:', taskNames)

      continue
    }

    if (input === '/quit') {
      rl.close()

      await stopThreadPool()

      console.log('bye')

      break
    }

    const [taskName, ...args] = input.split(' ')

    if (!autocomplete.includes(taskName)) {
      console.error(`unknown: ${taskName}`)

      continue
    }

    const taskRunner = tasksExported[taskName]
    const task = taskRunner(...args)
    const it = await task()

    try {
      const endTimeMs = startTimeMs()
      let i = 0

      for await (const _ of it) {
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(`items: ${++i}`)
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
