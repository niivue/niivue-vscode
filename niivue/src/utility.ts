// This function finds common patterns in the names and only returns the parts of the names that are different
export function differenceInNames(names: string[], rec = true) {
  if (names.length === 0) {
    return []
  }
  const minLen = Math.min(...names.map((name) => name.length))
  let startCommon = minLen
  outer: while (startCommon > 0) {
    const chars = names[0].slice(0, startCommon)
    for (let i = 1; i < names.length; i++) {
      if (names[i].slice(0, startCommon) !== chars) {
        startCommon -= 1
        continue outer
      }
    }
    break
  }
  // if startCommon points to a number then include all preceding numbers including "." as well
  while (
    startCommon > 0 &&
    (names[0].slice(startCommon - 1, startCommon) === '.' ||
      (names[0].slice(startCommon - 1, startCommon) >= '0' &&
        names[0].slice(startCommon - 1, startCommon) <= '9'))
  ) {
    startCommon -= 1
  }
  // if startCommon points to a letter then include all preceding letters as well
  while (
    startCommon > 0 &&
    names[0].slice(startCommon - 1, startCommon) >= 'a' &&
    names[0].slice(startCommon - 1, startCommon) <= 'z'
  ) {
    startCommon -= 1
  }

  let endCommon = minLen
  outer: while (endCommon > 0) {
    const chars = names[0].slice(-endCommon)
    for (let i = 1; i < names.length; i++) {
      if (names[i].slice(-endCommon) !== chars) {
        endCommon -= 1
        continue outer
      }
    }
    break
  }
  // if endCommon points to a number then include all following numbers as well
  while (
    endCommon > 0 &&
    names[0].slice(-endCommon, names[0].length - endCommon + 1) >= '0' &&
    names[0].slice(-endCommon, names[0].length - endCommon + 1) <= '9'
  ) {
    endCommon -= 1
  }
  // if endCommon points to a letter then include all following letters as well
  while (
    endCommon > 0 &&
    names[0].slice(-endCommon, names[0].length - endCommon + 1) >= 'a' &&
    names[0].slice(-endCommon, names[0].length - endCommon + 1) <= 'z'
  ) {
    endCommon -= 1
  }

  const diffNames = names.map((name) => name.slice(startCommon, name.length - endCommon))

  // If length is greater than display length, then split by folder and diff again for first folder and filename and join
  if (rec) {
    const folders = diffNames.map((name) => name.split('/').slice(0, -1).join('/'))
    const diffFolders = differenceInNames(folders, false)
    const filenames = diffNames.map((name) => name.split('/').slice(-1)[0])
    const diffFilenames = differenceInNames(filenames, false)
    diffNames.forEach((_, i) => {
      let seperator = ' - '
      if (!diffFolders[i] || !diffFilenames[i]) {
        seperator = ''
      }
      diffNames[i] = diffFolders[i] + seperator + diffFilenames[i]
    })
  }
  return diffNames
}

export function isImageType(item: string) {
  return [
    '.nii',
    '.nii.gz',
    '.dcm',
    '.mha',
    '.mhd',
    '.nhdr',
    '.nrrd',
    '.mgh',
    '.mgz',
    '.v',
    '.v16',
    '.vmr',
  ].find((fileType) => item.endsWith(fileType))
}

export function getMetadataString(nv: Niivue) {
  const meta = nv?.volumes?.[0]?.getImageMetadata()
  if (!meta || !meta.nx) {
    return ''
  }
  const matrixString = 'matrix size: ' + meta.nx + ' x ' + meta.ny + ' x ' + meta.nz
  const voxelString =
    'voxelsize: ' +
    meta.dx.toPrecision(2) +
    ' x ' +
    meta.dy.toPrecision(2) +
    ' x ' +
    meta.dz.toPrecision(2)
  const timeString = meta.nt > 1 ? ', timepoints: ' + meta.nt : ''
  return matrixString + ', ' + voxelString + timeString
}

export function getNumberOfPoints(nv: Niivue) {
  const mesh = nv?.meshes?.[0]
  const matrixString = 'Number of Points: ' + mesh.pts.length / 3
  return matrixString
}
