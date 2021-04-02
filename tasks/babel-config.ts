import type { TransformOptions } from '@babel/core'
import babelPluginSyntaxTopLevelAwait from '@babel/plugin-syntax-top-level-await'
import babelPresetEnv from '@babel/preset-env'
import babelPresetReact from '@babel/preset-react'
import babelPresetTypeScript from '@babel/preset-typescript'
import { babelPluginExt } from './babel-plugin-ext'

const NODE_VERSION = '12.22.0'

export const babelConfigBuildNode: TransformOptions = {
  babelrc: false,
  compact: false,
  sourceMaps: false,
  presets: [
    [
      babelPresetEnv,
      {
        targets: { node: NODE_VERSION },
        ignoreBrowserslistConfig: true,
        modules: false,
      },
    ],
  ],
  plugins: [
    babelPluginExt,
    babelPluginSyntaxTopLevelAwait,
    // '@babel/plugin-proposal-class-properties',
    // '@babel/plugin-proposal-private-methods',
    // '@babel/plugin-proposal-export-namespace-from',
  ],
  overrides: [
    {
      test: /\.(ts|tsx)$/,
      presets: [
        babelPresetTypeScript,
      ],
    },
    {
      test: /\.(ts|js)x$/,
      presets: [
        babelPresetReact,
      ],
    },
  ],
  shouldPrintComment: (val: string) => val.startsWith('#'),
}

export const babelConfigBuildWeb: TransformOptions = {
  babelrc: false,
  compact: false,
  sourceMaps: false,
  presets: [
    [
      babelPresetEnv,
      {
        targets: {
          browsers: 'last 2 Chrome versions',
        },
        ignoreBrowserslistConfig: true,
        modules: false,
      },
    ],
  ],
  plugins: [
    babelPluginExt,
  //   babelPluginSyntaxTopLevelAwait,
  //   // '@babel/plugin-proposal-class-properties',
  //   // '@babel/plugin-proposal-private-methods',
  //   // '@babel/plugin-proposal-export-namespace-from',
  ],
  overrides: [
    {
      test: /\.(ts|tsx)$/,
      presets: [
        babelPresetTypeScript,
      ],
    },
    {
      test: /\.(ts|js)x$/,
      presets: [
        babelPresetReact,
      ],
    },
  ],
}
