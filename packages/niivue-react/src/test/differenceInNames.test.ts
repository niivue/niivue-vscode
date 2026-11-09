import { expect, test } from 'vitest'
import { differenceInNames } from '../utility'

test('a single name is shown as its file name, not as an empty difference', () => {
  expect(differenceInNames(['csi_template_zf.mnc'])).toEqual(['csi_template_zf.mnc'])
  expect(differenceInNames(['/data/sub-01/anat/T1w.nii.gz'])).toEqual(['T1w.nii.gz'])
})

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
