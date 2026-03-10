import { expect, test } from 'vitest'
import { ExtendedNiivue } from '../events'
import { reorderImages } from '../utility'

// Test helper to create a mock ExtendedNiivue instance
function createMockNv(key: string): ExtendedNiivue {
  return {
    key,
    isLoaded: true,
    volumes: [
      {
        id: key,
        name: key,
        getImageMetadata: () => ({ nx: 100, ny: 100, nz: 100, dx: 1, dy: 1, dz: 1 }),
      },
    ],
  } as any
}

test('reorderImages moves image from position 0 to position 2', () => {
  const nvArray = [createMockNv('image1'), createMockNv('image2'), createMockNv('image3')]

  const reordered = reorderImages(nvArray, 0, 2)

  expect(reordered.map((nv) => nv.key)).toEqual(['image2', 'image3', 'image1'])
})

test('reorderImages moves image from position 2 to position 0', () => {
  const nvArray = [createMockNv('image1'), createMockNv('image2'), createMockNv('image3')]

  const reordered = reorderImages(nvArray, 2, 0)

  expect(reordered.map((nv) => nv.key)).toEqual(['image3', 'image1', 'image2'])
})

test('reorderImages moves image from position 1 to position 2', () => {
  const nvArray = [
    createMockNv('image1'),
    createMockNv('image2'),
    createMockNv('image3'),
    createMockNv('image4'),
  ]

  const reordered = reorderImages(nvArray, 1, 2)

  expect(reordered.map((nv) => nv.key)).toEqual(['image1', 'image3', 'image2', 'image4'])
})

test('reorderImages handles same position gracefully', () => {
  const nvArray = [createMockNv('image1'), createMockNv('image2'), createMockNv('image3')]

  const reordered = reorderImages(nvArray, 1, 1)

  expect(reordered.map((nv) => nv.key)).toEqual(['image1', 'image2', 'image3'])
})

test('reorderImages with two images', () => {
  const nvArray = [createMockNv('image1'), createMockNv('image2')]

  const reordered = reorderImages(nvArray, 0, 1)

  expect(reordered.map((nv) => nv.key)).toEqual(['image2', 'image1'])
})
