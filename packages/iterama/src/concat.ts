import { iterate } from './iterate'

export const concat = <T>(iterables: Iterable<Iterable<T>>): Iterable<T> => ({
  *[Symbol.iterator]() {
    for (const it of iterables) {
      yield* iterate(it)
    }
  },
})
