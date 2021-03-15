import type { TJsonValue } from 'typeon'

export type TStartThreadPoolOptions = {
  threadCount: number,
  socketPath: string,
}

export type TWsMessage = {
  id: string,
  value: {
    arg: string,
    fnString: string,
  },
}

export type TWorkerMessageDone = {
  type: 'DONE',
  value: TJsonValue,
}

export type TWorkerMessageError = {
  type: 'ERROR',
  value: string,
}

export type TWorkerMessage = TWorkerMessageDone | TWorkerMessageError
