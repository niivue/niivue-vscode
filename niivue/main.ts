import { render } from 'preact'
import { useRef, useState, useEffect, MutableRef } from 'preact/hooks'
import { html } from 'htm/preact'
import { Niivue, NVImage, NVMesh, SLICE_TYPE } from '@niivue/niivue'
;(function () {
  const imageFileTypes =
    '.nii,.nii.gz,.dcm,.mha,.mhd,.nhdr,.nrrd,.mgh,.mgz,.v,.v16,.vmr'

  const App = () => {
    const headerRef = useRef()
    const footerRef = useRef()
    const [hideUI, setHideUI] = useState(2) // 0: hide all, 1: hide overlay, 2: show-all
    const [crosshair, setCrosshair] = useState(true)
    const [nvArray, setNvArray] = useState([])
    const [nv0, setNv0] = useState({ isLoaded: false })
    const [sliceType, setSliceType] = useState(SLICE_TYPE.MULTIPLANAR) // all views
    const [interpolation, setInterpolation] = useState(true)
    const [scaling, setScaling] = useState({ isManual: false, min: 0, max: 0 })
    const [location, setLocation] = useState('')
    useEffect(() => {
      window.onmessage = createMessageListener(setNvArray, setSliceType)
    }, [])

    return html`
      <${Header} heightRef=${headerRef} nv=${nv0} />
      <${Container}
        nvArray=${nvArray}
        setNv0=${setNv0}
        sliceType=${sliceType}
        interpolation=${interpolation}
        scaling=${scaling}
        setLocation=${setLocation}
        headerRef=${headerRef}
        footerRef=${footerRef}
        hideUI=${hideUI}
        crosshair=${crosshair}
      />
      <${Footer}
        heightRef=${footerRef}
        sliceType=${sliceType}
        setSliceType=${setSliceType}
        interpolation=${interpolation}
        setInterpolation=${setInterpolation}
        setScaling=${setScaling}
        nv0=${nv0}
        location=${location}
        setHideUI=${setHideUI}
        setCrosshair=${setCrosshair}
      />
    `
  }

  const Container = ({ nvArray, headerRef, footerRef, ...props }) => {
    const [[windowWidth, windowHeight], setDimensions] = useState([
      window.innerWidth,
      window.innerHeight,
    ])
    const [change, triggerRender] = useState(0)
    const updateDimensions = () => {
      const headerHeight = headerRef.current
        ? headerRef.current.offsetHeight
        : 20
      const footerHeight = footerRef.current
        ? footerRef.current.offsetHeight
        : 20
      setDimensions([
        window.innerWidth - 10,
        window.innerHeight - headerHeight - footerHeight,
      ])
    }
    useEffect(updateDimensions, [change])
    useEffect(() => {
      window.onresize = updateDimensions
      updateDimensions()
    }, [])
    nvArray.forEach((nv) =>
      nv.broadcastTo(nvArray.filter((nvi) => nvi !== nv && nvi.isLoaded)),
    )

    const meta =
      nvArray.length > 0 && nvArray[0].volumes.length > 0
        ? nvArray[0].volumes[0].getImageMetadata()
        : {}
    const [width, height] = getCanvasSize(
      nvArray.length,
      meta,
      props.sliceType,
      windowWidth,
      windowHeight,
    )
    const names = differenceInNames(getNames(nvArray))
    return html`
      <div class="container">
        ${nvArray.map(
          (nv, i) =>
            html`<${Volume}
              nv=${nv}
              width=${width}
              height=${height}
              volumeIndex=${i}
              name=${names[i]}
              triggerRender=${triggerRender}
              ...${props}
            />`,
        )}
      </div>
    `
  }

  const Volume = ({ name, volumeIndex, hideUI, ...props }) => {
    const [intensity, setIntensity] = useState('')
    const volumeRef = useRef()
    const dispName = name.length > 20 ? `...${name.slice(-20)}` : name
    return html`
      <div class="volume" ref=${volumeRef}>
        ${hideUI > 0 && html`<div class="volume-name">${dispName}</div>`}
        <${NiiVue} ...${props} setIntensity=${setIntensity} />
        ${hideUI > 0 &&
        html`<div class="horizontal-layout volume-footer">
          ${hideUI > 1 &&
          html`<${VolumeOverlay}
            nv=${props.nv}
            volumeIndex=${volumeIndex}
            volumeRef=${volumeRef}
          />`}
          <span class="volume-intensity">${intensity}</span>
        </div>`}
      </div>
    `
  }

  const NiiVue = ({
    nv,
    setIntensity,
    width,
    height,
    setNv0,
    sliceType,
    interpolation,
    scaling,
    setLocation,
    triggerRender,
    crosshair,
  }) => {
    const canvasRef = useRef()
    useEffect(() => nv.attachToCanvas(canvasRef.current), [])
    useEffect(async () => {
      if (!nv.body) {
        return
      }
      await loadVolume(nv, nv.body)
      nv.isLoaded = true
      nv.body = null
      nv.onLocationChange = (data) =>
        setIntensityAndLocation(data, setIntensity, setLocation)
      nv.createOnLocationChange()
      setNv0((nv0) => (nv0.isLoaded ? nv0 : nv))

      // simulate click on canvas to adjust aspect ratio of nv instance
      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const factor = sliceType === SLICE_TYPE.MULTIPLANAR ? 4 : 2
      const x = rect.left + rect.width / factor
      const y = rect.top + rect.height / factor
      await new Promise((resolve) => setTimeout(resolve, 100))
      canvas.dispatchEvent(
        new MouseEvent('mousedown', { clientX: x, clientY: y }),
      )
      canvas.dispatchEvent(
        new MouseEvent('mouseup', { clientX: x, clientY: y }),
      )
      // sleep to avoid black images
      await new Promise((resolve) => setTimeout(resolve, 100))
      triggerRender((change) => change + 1)
    }, [nv.body])
    useEffect(() => nv.setSliceType(sliceType), [sliceType])
    useEffect(() => nv.setInterpolation(!interpolation), [interpolation])
    useEffect(() => applyScale(nv, scaling), [scaling])
    useEffect(() => nv.isLoaded && nv.setCrosshairWidth(crosshair), [crosshair])

    return html`<canvas
      ref=${canvasRef}
      width=${width}
      height=${height}
    ></canvas>`
  }

  const VolumeOverlay = ({ nv, volumeIndex, volumeRef }) => {
    const [isOpen, setIsOpen] = useState(false)
    const removeContextMenu = () => {
      setIsOpen(false)
      volumeRef.current.onclick -= removeContextMenu
      volumeRef.current.oncontextmenu -= removeContextMenu
    }
    const onContextmenu = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsOpen(true)
      volumeRef.current.onclick = removeContextMenu
      volumeRef.current.oncontextmenu = removeContextMenu
    }

    return html`
      <span
        class="volume-overlay"
        title="Right Click"
        oncontextmenu=${onContextmenu}
        >Overlay</span
      >
      <${OverlayOptions} nv=${nv} />
      ${isOpen && html`<${ContextMenu} nv=${nv} volumeIndex=${volumeIndex} />`}
    `
  }

  const OverlayOptions = ({ nv }) => {
    const isVolumeOverlay = nv.volumes.length > 1
    const isMeshOverlay = nv.meshes.length > 0 && nv.meshes[0].layers.length > 0

    if (!isVolumeOverlay && !isMeshOverlay) {
      return html``
    }

    const layers = isVolumeOverlay ? nv.volumes : nv.meshes[0].layers
    const overlay = layers[layers.length - 1]

    const colormaps = isVolumeOverlay
      ? ['symmetric', ...nv.colormaps()]
      : ['ge_color', 'hsv', 'symmetric', 'warm']
    return html`
      <${Scaling}
        setScaling=${(scaling) =>
          setOverlayScaling(nv, isVolumeOverlay, scaling)}
        init=${overlay}
      />
      <select
        onchange=${(e) =>
          setOverlayColormap(nv, isVolumeOverlay, e.target.value)}
        value=${overlay.colormap}
      >
        ${colormaps.map((c) => html`<option value=${c}>${c}</option>`)}
      </select>
    `
  }

  function setOverlayScaling(nv, isVolumeOverlay, scaling) {
    if (isVolumeOverlay) {
      const overlay = nv.volumes[nv.volumes.length - 1]
      overlay.cal_min = scaling.min
      overlay.cal_max = scaling.max
    } else {
      const layerNumber = nv.meshes[0].layers.length - 1
      nv.setMeshLayerProperty(
        nv.meshes[0].id,
        layerNumber,
        'cal_min',
        scaling.min,
      )
      nv.setMeshLayerProperty(
        nv.meshes[0].id,
        layerNumber,
        'cal_max',
        scaling.max,
      )
    }
    nv.updateGLVolume()
  }

  function setOverlayColormap(nv, isVolumeOverlay, colormap) {
    if (isVolumeOverlay) {
      const overlay = nv.volumes[nv.volumes.length - 1]
      if (colormap === 'symmetric') {
        overlay.useNegativeCmap = true
        overlay.colormap = 'warm'
        overlay.colormapNegative = 'winter'
      } else {
        overlay.useNegativeCmap = false
        overlay.colormap = colormap
        overlay.colormapNegative = ''
      }
    } else {
      const layerNumber = nv.meshes[0].layers.length - 1
      if (colormap === 'symmetric') {
        nv.setMeshLayerProperty(
          nv.meshes[0].id,
          layerNumber,
          'useNegativeCmap',
          true,
        )
        nv.setMeshLayerProperty(
          nv.meshes[0].id,
          layerNumber,
          'colormap',
          'warm',
        )
        nv.setMeshLayerProperty(
          nv.meshes[0].id,
          layerNumber,
          'colormapNegative',
          'winter',
        )
      } else {
        nv.setMeshLayerProperty(
          nv.meshes[0].id,
          layerNumber,
          'useNegativeCmap',
          false,
        )
        nv.setMeshLayerProperty(
          nv.meshes[0].id,
          layerNumber,
          'colormap',
          colormap,
        )
        nv.setMeshLayerProperty(
          nv.meshes[0].id,
          layerNumber,
          'colormapNegative',
          '',
        )
      }
    }
    nv.updateGLVolume()
  }

  const ContextMenu = ({ nv, volumeIndex }) => {
    const contextMenu = useRef()
    const nVolumes = nv.volumes.length
    const nMeshes = nv.meshes.length
    const nMeshLayers = nMeshes > 0 ? nv.meshes[0].layers.length : 0
    const removeLastVolume = () => {
      nv.removeVolumeByIndex(nVolumes - 1)
      nv.updateGLVolume()
    }
    return html`
      <div
        class="context-menu"
        ref=${contextMenu}
        style=${`left: 30px; bottom: 20px;`}
      >
        <div
          class="context-menu-item"
          onclick=${() => addOverlayEvent(volumeIndex, 'overlay')}
        >
          Add
        </div>
        ${nVolumes > 1 &&
        html`<div class="context-menu-item" onclick=${removeLastVolume}>
          Remove
        </div>`}
        ${nMeshes > 0 &&
        html`
          <div
            class="context-menu-item"
            onclick=${() => addOverlayEvent(volumeIndex, 'addMeshCurvature')}
          >
            Add Mesh Curvature
          </div>
          <div
            class="context-menu-item"
            onclick=${() => addOverlayEvent(volumeIndex, 'addMeshOverlay')}
          >
            Add Mesh Overlay
          </div>
          ${nMeshLayers > 0 &&
          html`<div
            class="context-menu-item"
            onclick=${() => addOverlayEvent(volumeIndex, 'replaceMeshOverlay')}
          >
            Replace Mesh Overlay
          </div>`}
        `}
      </div>
    `
  }

  const Header = ({ nv, heightRef }) =>
    nv.isLoaded &&
    nv.volumes.length > 0 &&
    html`
      <div class="horizontal-layout" ref=${heightRef}>
        <${ShowHeaderButton} info=${nv.volumes[0].hdr.toFormattedString()} />
        <${MetaData} meta=${nv.volumes[0].getImageMetadata()} />
      </div>
    `

  const MetaData = ({ meta }) => {
    if (!meta.nx) {
      return html``
    }
    const matrixString = `matrix size: ${meta.nx} x ${meta.ny} x ${meta.nz}`
    const voxelString = `voxelsize: ${meta.dx.toPrecision(
      2,
    )} x ${meta.dy.toPrecision(2)} x ${meta.dz.toPrecision(2)}`
    const timeString = meta.nt > 1 ? `, timepoints: ${meta.nt}` : ''
    return html`<p>${matrixString}, ${voxelString}${timeString}</p>`
  }

  const ShowHeaderButton = ({ info }) => {
    const dialog = useRef()
    const [text, setText] = useState('Header')

    const headerButtonClick = () => {
      setText(info)
      dialog.current.showModal()
    }

    return html`
      <button onClick=${headerButtonClick}>Header</button>
      <dialog ref=${dialog}>
        <form>
          ${text.split('\n').map((line) => html` <p>${line}</p> `)}
          <button formmethod="dialog" value="cancel">Close</button>
        </form>
      </dialog>
    `
  }

  const Footer = ({
    heightRef,
    sliceType,
    setSliceType,
    interpolation,
    setInterpolation,
    setScaling,
    nv0,
    location,
    setHideUI,
    setCrosshair,
  }) => html`
    <div ref=${heightRef}>
      <div>${location}</div>
      <div class="horizontal-layout">
        <${AddImagesButton} />
        <${NearestInterpolation}
          interpolation=${interpolation}
          setInterpolation=${setInterpolation}
        />
        ${nv0.isLoaded &&
        nv0.volumes.length > 0 &&
        html`<${Scaling} setScaling=${setScaling} init=${nv0.volumes[0]} />`}
        <${SelectView} sliceType=${sliceType} setSliceType=${setSliceType} />
        ${nv0.isLoaded &&
        nv0.meshes.length > 0 &&
        html`<${SceneControls} nv=${nv0} />`}
        <button onClick=${() => setHideUI((hideUI) => (hideUI + 1) % 3)}>
          👁
        </button>
        <button onClick=${() => setCrosshair((crosshair) => !crosshair)}>
          ⌖
        </button>
      </div>
    </div>
  `

  const SceneControls = ({ nv }) => html`
    <button onClick=${() => saveScene(nv)}>Save Scene</button>
    <button onClick=${() => loadScene(nv)}>Load Scene</button>
  `

  const AddImagesButton = () =>
    html`<button onClick=${addImagesEvent}>Add Images</button>`

  const NearestInterpolation = ({ interpolation, setInterpolation }) => html`
    <label>
      <span>Interpolation</span>
      <input
        type="checkbox"
        checked=${interpolation}
        onchange=${(e) => setInterpolation(e.target.checked)}
      />
    </label>
  `

  const Scaling = ({ setScaling, init }) => {
    const minRef = useRef()
    const maxRef = useRef()
    useEffect(() => {
      if (!init.cal_min) {
        return
      }
      minRef.current.value = init.cal_min.toPrecision(2)
      maxRef.current.value = init.cal_max.toPrecision(2)
      const step = ((init.cal_max - init.cal_min) / 10).toPrecision(2)
      minRef.current.step = step
      maxRef.current.step = step
    }, [init])
    const update = () =>
      setScaling({
        isManual: true,
        min: parseFloat(minRef.current.value),
        max: parseFloat(maxRef.current.value),
      })
    return html`
      <label>
        <span>Min </span>
        <input type="number" ref=${minRef} onchange=${update} />
      </label>
      <label>
        <span>Max </span>
        <input type="number" ref=${maxRef} onchange=${update} />
      </label>
    `
  }

  const SelectView = ({ sliceType, setSliceType }) => html`
    <select
      onchange=${(e) => setSliceType(parseInt(e.target.value))}
      value=${sliceType}
    >
      <option value=${SLICE_TYPE.AXIAL}>Axial</option>
      <option value=${SLICE_TYPE.CORONAL}>Coronal</option>
      <option value=${SLICE_TYPE.SAGITTAL}>Sagittal</option>
      <option value=${SLICE_TYPE.MULTIPLANAR}>Multiplanar</option>
      <option value=${SLICE_TYPE.RENDER}>Render</option>
    </select>
  `

  function createMessageListener(setNvArray: Function, setSliceType: Function) {
    async function messageListener(e) {
      setNvArray((nvArray) => {
        const { type, body } = e.data
        switch (type) {
          case 'addMeshOverlay':
            {
              addMeshOverlay(nvArray[body.index], body, 'overlay')
            }
            break
          case 'addMeshCurvature':
            {
              addMeshOverlay(nvArray[body.index], body, 'curvature')
            }
            break
          case 'replaceMeshOverlay':
            {
              addMeshOverlay(nvArray[body.index], body, 'replaceOverlay')
            }
            break
          case 'overlay':
            {
              addOverlay(nvArray[body.index], body)
            }
            break
          case 'addImage':
            {
              const nv = getUnitinializedNvInstance(nvArray)
              nv.body = body
              nv.isNew = false
            }
            break
          case 'initCanvas':
            {
              if (nvArray.length + body.n > 1) {
                setSliceType(SLICE_TYPE.AXIAL)
              }
              growNvArrayBy(nvArray, body.n)
            }
            break
        }
        return [...nvArray] // triggers rerender after each received message
      })
    }
    return messageListener
  }

  function getUnitinializedNvInstance(nvArray) {
    const nv = nvArray.find((nv) => nv.isNew)
    if (nv) {
      return nv
    }
    growNvArrayBy(nvArray, 1)
    return nvArray[nvArray.length - 1]
  }

  function growNvArrayBy(nvArray, n) {
    for (let i = 0; i < n; i++) {
      const nv = new Niivue({ isResizeCanvas: false })
      nv.isNew = true
      nv.isLoaded = false
      nvArray.push(nv)
    }
  }

  function setIntensityAndLocation(data, setIntensity, setLocation) {
    const parts = data.string.split('=')
    if (parts.length === 2) {
      setIntensity(parts.pop())
    }
    setLocation(parts.pop())
  }

  function getMinimalHeaderMHA() {
    const matrixSize = prompt('Please enter the matrix size:', '64 64 39 float')
    const dim = matrixSize.split(' ').length - 1
    const type = matrixSize.split(' ').pop().toUpperCase()
    const header = `ObjectType = Image\nNDims = ${dim}\nDimSize = ${matrixSize}\nElementType = MET_${type}\nElementDataFile = image.raw`
    return new TextEncoder().encode(header).buffer
  }

  async function loadVolume(nv, item) {
    if (item.uri.endsWith('.raw')) {
      const volume = new NVImage(
        getMinimalHeaderMHA(),
        `${item.uri}.mha`,
        'gray',
        1.0,
        item.data,
      )
      nv.addVolume(volume)
    } else if (isImageType(item)) {
      if (item.data) {
        const volume = new NVImage(item.data, item.uri)
        nv.addVolume(volume)
      } else {
        const volumeList = [{ url: item.uri }]
        await nv.loadVolumes(volumeList)
      }
    } else if (item.data) {
      NVMesh.readMesh(item.data, item.uri, nv.gl).then((mesh) => {
        nv.addMesh(mesh)
      })
    } else {
      const meshList = [{ url: item.uri }]
      nv.loadMeshes(meshList)
    }
  }

  function getAspectRatio(meta, sliceType) {
    if (!meta.nx) {
      return 1
    }
    const xSize = meta.nx * meta.dx
    const ySize = meta.ny * meta.dy
    const zSize = meta.nz * meta.dz
    if (sliceType === SLICE_TYPE.AXIAL) {
      return xSize / ySize
    } else if (sliceType === SLICE_TYPE.CORONAL) {
      return xSize / zSize
    } else if (sliceType === SLICE_TYPE.SAGITTAL) {
      return ySize / zSize
    } else if (sliceType === SLICE_TYPE.MULTIPLANAR) {
      return (xSize + ySize) / (zSize + ySize)
    }
    return 1
  }

  function applyScale(nv, scaling) {
    if (scaling.isManual) {
      nv.volumes[0].cal_min = scaling.min
      nv.volumes[0].cal_max = scaling.max
      nv.updateGLVolume()
    }
  }

  function getCanvasSize(
    nCanvas,
    meta,
    sliceType,
    windowWidthExt,
    windowHeightExt,
  ) {
    const gap = 4
    const aspectRatio = getAspectRatio(meta, sliceType)
    if (nCanvas === 0) {
      nCanvas = 1
    }
    const windowWidth = windowWidthExt
    const windowHeight = windowHeightExt

    let bestWidth = 0
    for (let nrow = 1; nrow <= nCanvas; nrow++) {
      const ncol = Math.ceil(nCanvas / nrow)
      const maxHeight = Math.floor(windowHeight / nrow - gap)
      const maxWidth = Math.floor(
        Math.min(windowWidth / ncol - gap, maxHeight * aspectRatio),
      )
      if (maxWidth > bestWidth) {
        bestWidth = maxWidth
      }
    }
    return [bestWidth, bestWidth / aspectRatio]
  }

  // This function finds common patterns in the names and only returns the parts of the names that are different
  function differenceInNames(names, rec = true) {
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

    const diffNames = names.map((name) =>
      name.slice(startCommon, name.length - endCommon),
    )

    // If length is greater than display length, then split by folder and diff again for first folder and filename and join
    if (rec) {
      const folders = diffNames.map((name) =>
        name.split('/').slice(0, -1).join('/'),
      )
      const diffFolders = differenceInNames(folders, false)
      const filenames = diffNames.map((name) => name.split('/').slice(-1)[0])
      const diffFilenames = differenceInNames(filenames, false)
      diffNames.forEach((name, i) => {
        let seperator = ' - '
        if (!diffFolders[i] || !diffFilenames[i]) {
          seperator = ''
        }
        diffNames[i] = diffFolders[i] + seperator + diffFilenames[i]
      })
    }
    return diffNames
  }

  function isImageType(item) {
    const fileTypesArray = imageFileTypes.split(',')
    return fileTypesArray.find((fileType) => item.uri.endsWith(fileType))
  }

  function getNames(nvArray) {
    return nvArray.map((item) => {
      if (item.volumes.length > 0) {
        return decodeURIComponent(item.volumes[0].name)
      }
      if (item.meshes.length > 0) {
        return decodeURIComponent(item.meshes[0].name)
      }
      return ''
    })
  }

  function addMeshOverlay(nv, item, type) {
    if (nv.meshes.length === 0) {
      return
    }

    const a = {}
    switch (type) {
      case 'curvature':
        {
          a.opacity = 0.7
          a.colormap = 'gray'
          a.useNegativeCmap = false
          a.calMin = 0.3
          a.calMax = 0.5
        }
        break
      case 'overlay':
      case 'replaceOverlay':
        {
          a.opacity = 0.7
          a.colormap = 'hsv'
          a.colormapNegative = ''
          a.useNegativeCmap = false
        }
        break
    }
    const mesh = nv.meshes[0]
    if (type === 'replaceOverlay') {
      mesh.layers.pop()
    }
    NVMesh.readLayer(
      item.uri,
      item.data,
      mesh,
      a.opacity,
      a.colormap,
      a.colormapNegative,
      a.useNegativeCmap,
      a.calMin,
      a.calMax,
    )
    mesh.updateMesh(nv.gl)
    nv.opts.isColorbar = true
    nv.updateGLVolume()
    const layerNumber = nv.meshes[0].layers.length - 1
    if (type === 'curvature') {
      nv.setMeshLayerProperty(
        nv.meshes[0].id,
        layerNumber,
        'colorbarVisible',
        false,
      )
    }
  }

  async function addOverlay(nv, item) {
    if (isImageType(item)) {
      const image = new niivue.NVImage(item.data, item.uri, 'redyell', 0.5)
      nv.addVolume(image)
    } else {
      const mesh = await niivue.NVMesh.readMesh(item.data, item.uri, nv.gl, 0.5)
      nv.addMesh(mesh)
    }
  }

  function addOverlayEvent(imageIndex, type) {
    if (typeof vscode === 'object') {
      vscode.postMessage({
        type: 'addOverlay',
        body: { type, index: imageIndex },
      })
    } else {
      const input = document.createElement('input')
      input.type = 'file'

      input.onchange = async (e) => {
        const file = e.target.files[0]
        file.arrayBuffer().then((data) => {
          window.postMessage({
            type,
            body: {
              data,
              uri: file.name,
              index: imageIndex,
            },
          })
        })
      }
      input.click()
    }
  }

  function addImagesEvent() {
    if (typeof vscode === 'object') {
      vscode.postMessage({ type: 'addImages' })
    } else {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      // input.accept = imageFileTypes;

      input.onchange = async (e) => {
        window.postMessage({
          type: 'initCanvas',
          body: {
            n: e.target.files.length,
          },
        })
        for (const file of e.target.files) {
          const data = await file.arrayBuffer()
          window.postMessage({
            type: 'addImage',
            body: {
              data,
              uri: file.name,
            },
          })
        }
      }
      input.click()
    }
  }

  function saveScene(nv) {
    const scene = nv.scene
    const json = JSON.stringify(scene)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scene.json'
    a.click()
  }

  function loadScene(nv) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        const json = JSON.parse(e.target.result)
        nv.scene = json
        nv.updateGLVolume()
        syncAll(nv)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // This function is identical to nv.sync, but ignores the focus requirement
  function syncAll(nv) {
    if (!nv.otherNV || typeof nv.otherNV === 'undefined') {
      return
    }
    let thisMM = nv.frac2mm(nv.scene.crosshairPos)
    // if nv.otherNV is an object, then it is a single Niivue instance
    if (nv.otherNV instanceof Niivue) {
      if (nv.syncOpts['2d']) {
        nv.otherNV.scene.crosshairPos = nv.otherNV.mm2frac(thisMM)
      }
      if (nv.syncOpts['3d']) {
        nv.otherNV.scene.renderAzimuth = nv.scene.renderAzimuth
        nv.otherNV.scene.renderElevation = nv.scene.renderElevation
      }
      nv.otherNV.drawScene()
      nv.otherNV.createOnLocationChange()
    } else if (Array.isArray(nv.otherNV)) {
      for (let i = 0; i < nv.otherNV.length; i++) {
        if (nv.otherNV[i] == nv) {
          continue
        }
        if (nv.syncOpts['2d']) {
          nv.otherNV[i].scene.crosshairPos = nv.otherNV[i].mm2frac(thisMM)
        }
        if (nv.syncOpts['3d']) {
          nv.otherNV[i].scene.renderAzimuth = nv.scene.renderAzimuth
          nv.otherNV[i].scene.renderElevation = nv.scene.renderElevation
        }
        nv.otherNV[i].drawScene()
        nv.otherNV[i].createOnLocationChange()
      }
    }
  }

  const app = document.getElementById('app')
  if (app) {
    render(html`<${App} />`, app)
  }
})()
