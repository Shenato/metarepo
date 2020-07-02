import test from 'tape'
import { rangeAsync } from '../src/range-async'
import { toSetAsync } from '../src/to-set-async'

test('iterama: toSetAsync', async (t) => {
  const iterable = rangeAsync(5)
  const result = await toSetAsync(iterable)

  t.deepEquals(
    result,
    new Set([0, 1, 2, 3, 4]),
    'should convert async iterable into set'
  )

  t.end()
})
