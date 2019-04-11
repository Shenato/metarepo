/* eslint-disable import/named */
import { TGitOptions } from '@auto/git'
import { TPrefixes, TWorkspacesOptions } from '@auto/utils'
import { TBumpOptions } from '@auto/bump'
import { TNpmOptions } from '@auto/npm'

export const prefixes: TPrefixes = {
  required: {
    major: {
      title: 'Breaking change',
      value: '💥',
    },
    minor: {
      title: 'New feature',
      value: '🌱',
    },
    patch: {
      title: 'Bugfix',
      value: '🐞',
    },
    publish: {
      title: 'New version',
      value: '📦',
    },
    dependencies: {
      title: 'Dependencies',
      value: '♻️',
    },
    initial: {
      title: 'Initial',
      value: '🐣',
    },
  },
  custom: [
    {
      title: 'Dependencies',
      value: '♻️',
    },
    {
      title: 'Lint',
      value: '🚷',
    },
    {
      title: 'Test',
      value: '👾',
    },
    {
      title: 'Docs',
      value: '📝',
    },
    {
      title: 'Demo',
      value: '📺',
    },
    {
      title: 'Refactor',
      value: '🛠',
    },
    {
      title: 'WIP',
      value: '🚧',
    },
    {
      title: 'Snapshots / Screenshots',
      value: '📸',
    },
    {
      title: 'Other',
      value: '🛠',
    },
  ],
}

export const gitOptions: TGitOptions = { initialType: 'minor' }

export const bumpOptions: TBumpOptions = {
  zeroBreakingChangeType: 'minor',
  shouldAlwaysBumpDependents: false,
}

export const npmOptions: TNpmOptions = {
  publishSubDirectory: 'build/',
}

export const workspacesOptions: TWorkspacesOptions = { autoNamePrefix: '@' }
