import { InlineBlock } from '@revert/block'
import { ImageContext } from '@revert/image'
import type { TComponentParagraph } from 'mdown'
import React from 'react'
import { component, mapThrottledHandlerAnimationFrame, startWithType } from 'refun'
import { mapRender } from './map-render'
import { SYMBOL_MARKDOWN_PARAGRAPH } from './symbols'

export const Paragraph = component(
  startWithType<TComponentParagraph>(),
  mapRender('onImageLoad'),
  mapThrottledHandlerAnimationFrame('onImageLoad')
)(({ onImageLoad, children }) => (
  <InlineBlock>
    <ImageContext.Provider value={{ onImageLoad }}>
      {children}
    </ImageContext.Provider>
  </InlineBlock>
))

Paragraph.displayName = 'MarkdownParagraph'
Paragraph.componentSymbol = SYMBOL_MARKDOWN_PARAGRAPH
