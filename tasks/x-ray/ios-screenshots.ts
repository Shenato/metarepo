import { xRay } from '@x-ray/core'
import { iOSScreenshots } from '@x-ray/plugin-ios-screenshots'

export const main = async () => {
  const xRayIOsScreenshots = xRay(iOSScreenshots({ shouldBailout: true }))

  await xRayIOsScreenshots([
    require.resolve('./examples/text1.tsx'),
    require.resolve('./examples/text2.tsx'),
  ])
}
