import React from 'react'
import { startWithType, mapState, mapWithPropsMemo, pureComponent, onUpdateAsync } from 'refun'
import { isDefined } from 'tsfn'
import { diffArrays } from 'diff'
import { Block as PrimitiveBlock } from '@primitives/block'
import { colorToString } from 'colorido'
import { apiLoadSnapshot } from '../api'
import { mapStoreDispatch } from '../store'
import { actionError } from '../actions'
import { TRect } from '../types'
import {
  SNAPSHOT_GRID_FONT_SIZE,
  SNAPSHOT_GRID_LINE_HEIGHT,
  COLOR_LINE_BG_ADDED,
  COLOR_LINE_BG_REMOVED,
  DISCARD_ALPHA,
  BORDER_SIZE,
  SNAPSHOT_GRID_MAX_LINES,
  DASH_SPACE,
  COLOR_WHITE,
  COLOR_ORANGE,
} from '../config'
import { Block } from './Block'
import { Background } from './Background'
import { Text } from './Text'

export type TDiffLine = {
  value: string,
  type?: 'added' | 'removed',
}

export type TSnapshotDiff = TRect & {
  id: string,
  isDiscarded: boolean,
}

// TODO: Background VS Text z-index

export const SnapshotDiff = pureComponent(
  startWithType<TSnapshotDiff>(),
  mapStoreDispatch('dispatch'),
  mapState('state', 'setState', () => null as TDiffLine[] | null, []),
  onUpdateAsync((props) => function *() {
    try {
      const [dataOrig, dataNew] = yield Promise.all([
        apiLoadSnapshot({ id: props.current.id, type: 'ORIG' }),
        apiLoadSnapshot({ id: props.current.id, type: 'NEW' }),
      ])
      const linesOrig = dataOrig.split('\n') as string[]
      const linesNew = dataNew.split('\n') as string[]
      const linesDiff = diffArrays(linesOrig, linesNew).reduce((result, chunk) => {
        result.push(
          ...chunk.value.map((line) => {
            if (chunk.added) {
              return {
                value: line,
                type: 'added' as const,
              }
            }

            if (chunk.removed) {
              return {
                value: line,
                type: 'removed' as const,
              }
            }

            return {
              value: line,
            }
          })
        )

        return result
      }, [] as TDiffLine[])

      console.log(linesDiff)

      props.current.setState(linesDiff)
    } catch (err) {
      console.error(err)
      props.current.dispatch(actionError(err.message))
    }
  }, []),
  mapWithPropsMemo(({ state }) => {
    if (state === null) {
      return {
        lines: [],
      }
    }

    if (state.length <= SNAPSHOT_GRID_MAX_LINES) {
      return {
        lines: state,
      }
    }

    const firstChangedLineIndex = state.findIndex((line) => isDefined(line.type))
    const removeTotalLinesCount = state.length - SNAPSHOT_GRID_MAX_LINES
    const removeTopLinesCount = Math.min(removeTotalLinesCount, firstChangedLineIndex)

    return {
      lines: state.slice(removeTopLinesCount, removeTopLinesCount + SNAPSHOT_GRID_MAX_LINES),
    }
  }, ['state'])
)(({ lines, top, left, width, height, isDiscarded }) => (
  <Block
    top={top}
    left={left}
    width={width}
    height={height}
    opacity={isDiscarded ? DISCARD_ALPHA : 1}
    style={{
      background: `repeating-linear-gradient(45deg,#fff,#fff ${BORDER_SIZE}px,${colorToString(COLOR_ORANGE)} ${BORDER_SIZE}px,${colorToString(COLOR_ORANGE)} ${DASH_SPACE}px)`,
    }}
  >
    <Block
      top={0}
      left={0}
      width={width}
      height={height - BORDER_SIZE}
      shouldHideOverflow
    >
      {lines.map((line, i) => (
        <Block
          key={i}
          left={BORDER_SIZE}
          top={i * SNAPSHOT_GRID_LINE_HEIGHT + BORDER_SIZE}
          height={SNAPSHOT_GRID_LINE_HEIGHT}
          width={width - BORDER_SIZE * 2}
          shouldHideOverflow
        >
          <Background color={COLOR_WHITE}/>
          {line.type === 'added' && (
            <Background color={COLOR_LINE_BG_ADDED}/>
          )}
          {line.type === 'removed' && (
            <Background color={COLOR_LINE_BG_REMOVED}/>
          )}
          <PrimitiveBlock>
            <Text
              fontFamily="monospace"
              fontSize={SNAPSHOT_GRID_FONT_SIZE}
              lineHeight={SNAPSHOT_GRID_LINE_HEIGHT}
              shouldPreserveWhitespace
              shouldPreventSelection
            >
              {line.value}
            </Text>
          </PrimitiveBlock>
        </Block>
      ))}
    </Block>
  </Block>
))

SnapshotDiff.displayName = 'SnapshotDiff'
