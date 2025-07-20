import { expect, test } from 'vitest'
import { differenceInNames } from '../utility'

test('diff names of test and test2', () => {
  expect(differenceInNames(['test', 'test2'])).toEqual(['test', 'test2'])
  expect(differenceInNames(['test1', 'test2'])).toEqual(['test1', 'test2'])
  expect(
    differenceInNames(['verysuperendlesslongnametest1', 'verysuperendlesslongnametest2']),
  ).toEqual(['verysuperendlesslongnametest1', 'verysuperendlesslongnametest2'])
  expect(differenceInNames(['test1.nii', 'test2.nii'])).toEqual(['test1', 'test2'])
  expect(differenceInNames(['qsm_test1', 'qsm_test2'])).toEqual(['test1', 'test2'])
  expect(differenceInNames(['Glu.nii.gz', 'Gln.nii.gz'])).toEqual(['Glu', 'Gln'])

  // for security reasons only the filename is available, but not the folder name
  expect(differenceInNames(['/folder1/qsm_test1', '/folder2/qsm_test2'])).toEqual([
    'folder1 - test1',
    'folder2 - test2',
  ])
  expect(differenceInNames(['/folder1/qsm_test', '/folder2/qsm_test'])).toEqual([
    'folder1',
    'folder2',
  ])
})
