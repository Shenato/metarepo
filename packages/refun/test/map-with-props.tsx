import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import test from 'blue-tape'
import { createSpy, getSpyCalls } from 'spyfn'
import { component, startWithType, mapWithProps } from '../src'

test('mapWithProps', (t) => {
  const spy = createSpy(({ args }) => ({ bar: args[0].foo * 2 }))
  const compSpy = createSpy(() => null)
  const getNumRenders = () => getSpyCalls(compSpy).length
  const MyComp = component(
    startWithType<{ foo: number }>(),
    mapWithProps(spy)
  )(compSpy)

  /* Mount */
  let testRenderer: any
  act(() => {
    testRenderer = TestRenderer.create(
      <MyComp foo={2}/>
    )
  })

  t.deepEquals(
    getSpyCalls(compSpy),
    [
      [{ foo: 2, bar: 4 }],
    ],
    'Mount: should pass props'
  )

  t.deepEquals(
    getSpyCalls(spy),
    [
      [{ foo: 2 }],
    ],
    'Mount: should call map function'
  )

  /* Update */
  act(() => {
    testRenderer.update(
      <MyComp foo={3}/>
    )
  })

  t.deepEquals(
    getSpyCalls(compSpy),
    [
      [{ foo: 2, bar: 4 }],
      [{ foo: 3, bar: 6 }],
    ],
    'Update: should pass props'
  )

  t.deepEquals(
    getSpyCalls(spy),
    [
      [{ foo: 2 }],
      [{ foo: 3 }],
    ],
    'Update: should call map function'
  )

  /* Unmount */
  act(() => {
    testRenderer.unmount()
  })

  t.deepEquals(
    getSpyCalls(spy),
    [
      [{ foo: 2 }],
      [{ foo: 3 }],
    ],
    'Unmount: should not call map function'
  )

  t.equals(
    getNumRenders(),
    2,
    'Render: should render component exact times'
  )

  t.end()
})
