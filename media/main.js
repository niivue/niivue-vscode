(function () {
    const { render, html, useRef, useState, useEffect } = htmPreact;
    const { Niivue, NVImage, NVMesh } = niivue;
    const imageFileTypes = '.nii,.nii.gz,.dcm,.mha,.mhd,.nhdr,.nrrd,.mgh,.mgz,.v,.v16,.vmr';

    const App = () => {
        const [nvArray, setNvArray] = useState([]);
        const [vol0, setVol0] = useState({});
        const [viewType, setViewType] = useState(3); // all views
        const [interpolation, setInterpolation] = useState(true);
        const [scaling, setScaling] = useState({ isManual: false, min: 0, max: 0 });
        const [location, setLocation] = useState("");
        useEffect(() => window.onmessage = createMessageListener(setNvArray, setViewType), []);

        // useEffect(() => window.postMessage({
        //     type: 'addImage',
        //     body: { uri: 'https://niivue.github.io/niivue/images/mni152.nii.gz' }
        // }), []);

        return html`
            <${Header} vol0=${vol0} />
            <${Container} nvArray=${nvArray} setVol0=${setVol0} viewType=${viewType} interpolation=${interpolation} scaling=${scaling} setLocation=${setLocation} />
            <${Footer} viewType=${viewType} setViewType=${setViewType} interpolation=${interpolation} setInterpolation=${setInterpolation} setScaling=${setScaling} vol0=${vol0} location=${location} />
        `;
    };

    const Container = ({ nvArray, ...props }) => {
        const [[windowWidth, windowHeight], setDimensions] = useState([window.innerWidth, window.innerHeight]);
        const [change, triggerRender] = useState(false);
        useEffect(() => window.onresize = () => setDimensions([window.innerWidth, window.innerHeight]), []);
        nvArray.forEach((nv) => nv.broadcastTo(nvArray.filter((nvi) => nvi !== nv)));

        const meta = nvArray.length > 0 && nvArray[0].volumes.length > 0 ? nvArray[0].volumes[0].getImageMetadata() : {};
        const [width, height] = getCanvasSize(nvArray.length, meta, props.viewType, windowWidth, windowHeight);
        const names = differenceInNames(getNames(nvArray));
        return html`
            <div class="container">
                ${nvArray.map((nv, i) => html`<${Volume} nv=${nv} width=${width} height=${height} volumeIndex=${i} name=${names[i]} triggerRender=${triggerRender} ...${props} />`)}
            </div>
        `;
    };

    const Volume = ({ name, volumeIndex, ...props }) => {
        const [intensity, setIntensity] = useState("");
        const volumeRef = useRef();
        return html`
            <div class="volume" ref=${volumeRef}>
                <div class="volume-name">${name}</div>
                <${NiiVue} ...${props} setIntensity=${setIntensity} />
                <div class="horizontal-layout volume-footer">
                    <${VolumeOverlay} nv=${props.nv} volumeIndex=${volumeIndex} volumeRef=${volumeRef} />
                    <span class="volume-intensity">${intensity}</span>
                </div>
            </div>
        `;
    };

    const VolumeOverlay = ({ nv, volumeIndex, volumeRef }) => {
        const [isOpen, setIsOpen] = useState(false);
        const removeContextMenu = () => {
            setIsOpen(false);
            volumeRef.current.onclick -= removeContextMenu;
            volumeRef.current.oncontextmenu -= removeContextMenu;
        };
        const onContextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
            volumeRef.current.onclick = removeContextMenu;
            volumeRef.current.oncontextmenu = removeContextMenu;
        };

        return html`
            <span class="volume-overlay" title="Right Click" oncontextmenu=${onContextmenu}>Overlay</span>
            <${OverlayOptions} nv=${nv} />
            ${isOpen && html`<${ContextMenu} nv=${nv} volumeIndex=${volumeIndex} />`}
        `;
    };

    const OverlayOptions = ({ nv }) => {
        const isVolumeOverlay = nv.volumes.length > 1;
        const isMeshOverlay = nv.meshes.length > 0 && nv.meshes[0].layers.length > 0;

        if (!isVolumeOverlay && !isMeshOverlay) { return html``; }

        const layers = isVolumeOverlay ? nv.volumes : nv.meshes[0].layers;
        const overlay = layers[layers.length - 1];

        const colormaps = isVolumeOverlay ? ["symmetric", ...nv.colormaps()] : ["ge_color", "hsv", "symmetric", "warm"];
        return html`
            <${Scaling} setScaling=${(scaling) => setOverlayScaling(nv, isVolumeOverlay, scaling)} init=${overlay} />
            <select onchange=${(e) => setOverlayColormap(nv, isVolumeOverlay, e.target.value)} value=${overlay.colormap}>
                ${colormaps.map((c) => html`<option value=${c}>${c}</option>`)}
            </select>
        `;
    };

    function setOverlayScaling(nv, isVolumeOverlay, scaling) {
        if (isVolumeOverlay) {
            const overlay = nv.volumes[nv.volumes.length - 1];
            overlay.cal_min = scaling.min;
            overlay.cal_max = scaling.max;
        } else {
            const layerNumber = nv.meshes[0].layers.length - 1;
            nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "cal_min", scaling.min);
            nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "cal_max", scaling.max);
        }
        nv.updateGLVolume();
    }

    function setOverlayColormap(nv, isVolumeOverlay, colormap) {
        if (isVolumeOverlay) {
            const overlay = nv.volumes[nv.volumes.length - 1];
            if (colormap === "symmetric") {
                overlay.useNegativeCmap = true;
                overlay.colormap = "warm";
                overlay.colormapNegative = "winter";
            } else {
                overlay.useNegativeCmap = false;
                overlay.colormap = colormap;
                overlay.colormapNegative = "";
            }
        } else {
            const layerNumber = nv.meshes[0].layers.length - 1;
            if (colormap === "symmetric") {
                nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "useNegativeCmap", true);
                nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "colormap", "warm");
                nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "colormapNegative", "winter");
            } else {
                nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "useNegativeCmap", false);
                nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "colormap", colormap);
                nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "colormapNegative", "");
            }
        }
        nv.updateGLVolume();
    }


    const ContextMenu = ({ nv, volumeIndex }) => {
        const contextMenu = useRef();
        const nVolumes = nv.volumes.length;
        const nMeshes = nv.meshes.length;
        const nMeshLayers = nMeshes > 0 ? nv.meshes[0].layers.length : 0;
        const removeLastVolume = () => {
            nv.removeVolumeByIndex(nVolumes - 1);
            nv.updateGLVolume();
        };
        return html`
            <div class="context-menu" ref=${contextMenu} style=${`left: 30px; bottom: 20px;`}>
                <div class="context-menu-item" onclick=${() => addOverlayEvent(volumeIndex, "overlay")}>Add</div>
                ${nVolumes > 1 && html`<div class="context-menu-item" onclick=${removeLastVolume}>Remove</div>`}
                ${nMeshes > 0 && html`
                    <div class="context-menu-item" onclick=${() => addOverlayEvent(volumeIndex, "addMeshCurvature")}>Add Mesh Curvature</div>
                    <div class="context-menu-item" onclick=${() => addOverlayEvent(volumeIndex, "addMeshOverlay")}>Add Mesh Overlay</div>
                    ${nMeshLayers > 0 && html`<div class="context-menu-item" onclick=${() => addOverlayEvent(volumeIndex, "replaceMeshOverlay")}>Replace Mesh Overlay</div>`}
                `}
            </div>
        `;
    };

    const NiiVue = ({ nv, setIntensity, width, height, setVol0, viewType, interpolation, scaling, setLocation, triggerRender }) => {
        const canvasRef = useRef();
        useEffect(() => nv.attachToCanvas(canvasRef.current), []);
        useEffect(async () => {
            if (!nv.body) { return; }
            await loadVolume(nv, nv.body);
            nv.body = null;
            nv.onLocationChange = (data) => setIntensityAndLocation(data, setIntensity, setLocation);
            nv.createOnLocationChange();
            triggerRender((change) => !change);
            setVol0((vol0) => (nv.volumes.length > 0 && !vol0.hdr) ? nv.volumes[0] : vol0);
        }, [nv.body]);
        useEffect(() => nv.setSliceType(viewType), [viewType]);
        useEffect(() => nv.setInterpolation(!interpolation), [interpolation]);
        useEffect(() => applyScale(nv, scaling), [scaling]);

        return html`<canvas ref=${canvasRef} width=${width} height=${height}></canvas>`;
    };

    const Header = ({ vol0 }) => vol0.hdr && html`
        <div class="horizontal-layout">
            <${ShowHeaderButton} info=${vol0.hdr.toFormattedString()} />
            <${MetaData} meta=${vol0.getImageMetadata()} />
        </div>
    `;

    const MetaData = ({ meta }) => {
        if (!meta.nx) { return html``; }
        const matrixString = "matrix size: " + meta.nx + " x " + meta.ny + " x " + meta.nz;
        const voxelString = "voxelsize: " + meta.dx.toPrecision(2) + " x " + meta.dy.toPrecision(2) + " x " + meta.dz.toPrecision(2);
        const timeString = meta.nt > 1 ? ", timepoints: " + meta.nt : "";
        return html`<p>${matrixString}, ${voxelString}${timeString}</p>`;
    };

    const ShowHeaderButton = ({ info }) => {
        const dialog = useRef();
        const [text, setText] = useState("Header");

        const headerButtonClick = () => {
            setText(info);
            dialog.current.showModal();
        };

        return html`
            <button onClick=${headerButtonClick}>Header</button>
            <dialog ref=${dialog}>
                <form>
                    ${text.split('\n').map((line) => html`
                        <p>${line}</p>
                    `)}
                    <button formmethod="dialog" value="cancel">Close</button>
                </form>
            </dialog>
        `;
    };

    const Footer = ({ viewType, setViewType, interpolation, setInterpolation, setScaling, vol0, location }) => html`
        <div>${location}</div>
        <div class="horizontal-layout">
            <${AddImagesButton} />
            <${NearestInterpolation} interpolation=${interpolation} setInterpolation=${setInterpolation} />
            <${Scaling} setScaling=${setScaling} init=${vol0} />
            <${SelectView} viewType=${viewType} setViewType=${setViewType} />
        </div>
    `;

    const AddImagesButton = () => html`<button onClick=${addImagesEvent}>Add Images</button>`;

    const NearestInterpolation = ({ interpolation, setInterpolation }) => html`
        <label>
            <span>Interpolation</span>
            <input type="checkbox" checked=${interpolation} onchange=${(e) => setInterpolation(e.target.checked)}/>
        </label>
    `;

    const Scaling = ({ setScaling, init }) => {
        const minRef = useRef();
        const maxRef = useRef();
        useEffect(() => {
            if (!init.cal_min) { return; }
            minRef.current.value = init.cal_min.toPrecision(2);
            maxRef.current.value = init.cal_max.toPrecision(2);
            const step = ((init.cal_max - init.cal_min) / 10).toPrecision(2);
            minRef.current.step = step;
            maxRef.current.step = step;
        }, [init]);
        const update = () => setScaling({ isManual: true, min: parseFloat(minRef.current.value), max: parseFloat(maxRef.current.value) });
        return html`
            <label>
                <span>Min </span>
                <input type="number" ref=${minRef} onchange=${update} />
            </label>
            <label>
                <span>Max </span>
                <input type="number" ref=${maxRef} onchange=${update} />
            </label>
        `;
    };

    const SelectView = ({ viewType, setViewType }) => html`
        <select onchange=${(e) => setViewType(parseInt(e.target.value))} value=${viewType}>
            <option value="0">Axial</option>
            <option value="1">Coronal</option>
            <option value="2">Sagittal</option>
            <option value="3">A+C+S+R</option>
            <option value="4">Render</option>
        </select>
    `;

    function createMessageListener(setNvArray, setViewType) {
        async function messageListener(e) {
            setNvArray((nvArray) => {
                const { type, body } = e.data;
                switch (type) {
                    case 'addMeshOverlay':
                        {
                            addMeshOverlay(nvArray[body.index], body, "overlay");
                        }
                        break;
                    case 'addMeshCurvature':
                        {
                            addMeshOverlay(nvArray[body.index], body, "curvature");
                        }
                        break;
                    case 'replaceMeshOverlay':
                        {
                            addMeshOverlay(nvArray[body.index], body, "replaceOverlay");
                        }
                        break;
                    case 'overlay':
                        {
                            addOverlay(nvArray[body.index], body);
                        }
                        break;
                    case "addImage":
                        {
                            const nv = getUnitinializedNvInstance(nvArray);
                            nv.body = body;
                        }
                        break;
                    case "initCanvas":
                        {
                            setViewType(0); // Axial
                            growNvArrayBy(nvArray, body.n);
                        }
                        break;
                }
                return [...nvArray]; // triggers rerender after each received message
            });
        }
        return messageListener;
    }

    function getUnitinializedNvInstance(nvArray) {
        const nv = nvArray.find((nv) => nv.volumes.length === 0 && nv.meshes.length === 0);
        if (nv) { return nv; }
        growNvArrayBy(nvArray, 1);
        return nvArray[nvArray.length - 1];
    }

    function growNvArrayBy(nvArray, n) {
        for (let i = 0; i < n; i++) {
            const nv = new Niivue({ isResizeCanvas: false });
            nvArray.push(nv);
        }
    }

    function setIntensityAndLocation(data, setIntensity, setLocation) {
        const parts = data.string.split("=");
        if (parts.length === 2) {
            setIntensity(parts.pop());
        }
        setLocation(parts.pop());
    }

    async function loadVolume(nv, item) {
        if (isImageType(item)) {
            if (item.data) {
                const volume = new NVImage(item.data, item.uri);
                nv.addVolume(volume);
            } else {
                const volumeList = [{ url: item.uri }];
                await nv.loadVolumes(volumeList);
            }
        } else {
            if (item.data) {
                NVMesh.readMesh(item.data, item.uri, nv.gl).then((mesh) => {
                    nv.addMesh(mesh);
                });
            } else {
                const meshList = [{ url: item.uri }];
                nv.loadMeshes(meshList);
            }
        }
    }

    function getAspectRatio(meta, viewType) {
        if (!meta.nx) { return 1; }
        const xSize = meta.nx * meta.dx;
        const ySize = meta.ny * meta.dy;
        const zSize = meta.nz * meta.dz;
        if (viewType === 0) {
            return xSize / ySize;
        } else if (viewType === 1) {
            return xSize / zSize;
        } else if (viewType === 2) {
            return ySize / zSize;
        }
        return 1;
    }

    function applyScale(nv, scaling) {
        if (scaling.isManual) {
            nv.volumes[0].cal_min = scaling.min;
            nv.volumes[0].cal_max = scaling.max;
            nv.updateGLVolume();
        }
    }

    function getCanvasSize(nCanvas, meta, viewType, windowWidthExt, windowHeightExt) {
        const aspectRatio = getAspectRatio(meta, viewType);
        if (nCanvas === 0) { nCanvas = 1; }
        const windowWidth = windowWidthExt - 25;
        const windowHeight = windowHeightExt - 75;

        let bestWidth = 0;
        for (nrow = 1; nrow <= nCanvas; nrow++) {
            const ncol = Math.ceil(nCanvas / nrow);
            const maxHeight = (windowHeight / nrow);
            const maxWidth = Math.min(windowWidth / ncol, maxHeight * aspectRatio);
            if (maxWidth > bestWidth) { bestWidth = maxWidth; }
        }
        return [bestWidth, bestWidth / aspectRatio];
    }

    // This function finds common patterns in the names and only returns the parts of the names that are different
    function differenceInNames(names, rec = true) {
        if (names.length === 0) { return []; }
        const minLen = Math.min(...names.map((name) => name.length));
        let startCommon = minLen;
        outer:
        while (startCommon > 0) {
            const chars = names[0].slice(0, startCommon);
            for (let i = 1; i < names.length; i++) {
                if (names[i].slice(0, startCommon) !== chars) {
                    startCommon -= 1;
                    continue outer;
                }
            }
            break;
        }
        // if startCommon points to a number then include all preceding numbers including "." as well
        while (startCommon > 0 && (names[0].slice(startCommon - 1, startCommon) === '.' || (names[0].slice(startCommon - 1, startCommon) >= '0' && names[0].slice(startCommon - 1, startCommon) <= '9'))) {
            startCommon -= 1;
        }
        let endCommon = minLen;
        outer:
        while (endCommon > 0) {
            const chars = names[0].slice(-endCommon);
            for (let i = 1; i < names.length; i++) {
                if (names[i].slice(-endCommon) !== chars) {
                    endCommon -= 1;
                    continue outer;
                }
            }
            break;
        }
        // if endCommon points to a number then include all following numbers as well
        while (endCommon > 0 && names[0].slice(-endCommon, names[0].length - endCommon + 1) >= '0' && names[0].slice(-endCommon, names[0].length - endCommon + 1) <= '9') {
            endCommon -= 1;
        }
        const diffNames = names.map((name) => name.slice(startCommon, name.length - endCommon));

        // If length is greater than display length, then split by folder and diff again for first folder and filename and join
        if (rec) {
            const folders = diffNames.map((name) => name.split('/').slice(0, -1).join('/'));
            const diffFolders = differenceInNames(folders, false);
            const filenames = diffNames.map((name) => name.split('/').slice(-1)[0]);
            const diffFilenames = differenceInNames(filenames, false);
            diffNames.forEach((name, i) => {
                let seperator = ' - ';
                if (!diffFolders[i] || !diffFilenames[i]) {
                    seperator = '';
                }
                diffNames[i] = diffFolders[i] + seperator + diffFilenames[i];
            });
        }
        return diffNames;
    }

    function isImageType(item) {
        const fileTypesArray = imageFileTypes.split(',');
        return fileTypesArray.find((fileType) => item.uri.endsWith(fileType));
    }

    function getNames(nvArray) {
        return nvArray.map((item) => {
            if (item.volumes.length > 0) {
                return decodeURIComponent(item.volumes[0].name);
            }
            if (item.meshes.length > 0) {
                return decodeURIComponent(item.meshes[0].name);
            }
            return "";
        });
    }

    function addMeshOverlay(nv, item, type) {
        if (nv.meshes.length === 0) { return; };

        const a = {};
        switch (type) {
            case "curvature":
                {
                    a.opacity = 0.7;
                    a.colormap = "gray";
                    a.useNegativeCmap = false;
                    a.calMin = 0.3;
                    a.calMax = 0.5;
                }
                break;
            case "overlay":
            case "replaceOverlay":
                {
                    a.opacity = 0.7;
                    a.colormap = "hsv";
                    a.colormapNegative = "";
                    a.useNegativeCmap = false;
                }
                break;
        }
        const mesh = nv.meshes[0];
        if (type === "replaceOverlay") {
            mesh.layers.pop();
        }
        NVMesh.readLayer(item.uri, item.data, mesh, a.opacity, a.colormap, a.colormapNegative, a.useNegativeCmap, a.calMin, a.calMax);
        mesh.updateMesh(nv.gl);
        nv.opts.isColorbar = true;
        nv.updateGLVolume();
        const layerNumber = nv.meshes[0].layers.length - 1;
        if (type === "curvature") {
            nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "colorbarVisible", false);
        }
    }

    async function addOverlay(nv, item) {
        if (isImageType(item)) {
            const image = new niivue.NVImage(item.data, item.uri, 'redyell', 0.5);
            nv.addVolume(image);
        } else {
            const mesh = await niivue.NVMesh.readMesh(item.data, item.uri, nv.gl, 0.5);
            nv.addMesh(mesh);
        }
    }

    function addOverlayEvent(imageIndex, type) {
        if (typeof vscode === 'object') {
            vscode.postMessage({ type: 'addOverlay', body: { type: type, index: imageIndex } });
        } else {
            const input = document.createElement('input');
            input.type = 'file';

            input.onchange = async (e) => {
                const file = e.target.files[0];
                file.arrayBuffer().then((data) => {
                    window.postMessage({
                        type: type,
                        body: {
                            data: data,
                            uri: file.name,
                            index: imageIndex
                        }
                    });
                });
            };
            input.click();
        }
    }

    function addImagesEvent() {
        if (typeof vscode === 'object') {
            vscode.postMessage({ type: 'addImages' });
        } else {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            // input.accept = imageFileTypes;

            input.onchange = async (e) => {
                window.postMessage({
                    type: 'initCanvas',
                    body: {
                        n: e.target.files.length
                    }
                });
                for (const file of e.target.files) {
                    data = await file.arrayBuffer();
                    window.postMessage({
                        type: 'addImage',
                        body: {
                            data: data,
                            uri: file.name
                        }
                    });
                }
            };
            input.click();
        }
    }

    render(html`<${App} />`, document.getElementById("app"));

    if (typeof acquireVsCodeApi === 'function') {
        acquireVsCodeApi().postMessage({ type: 'ready' });
    }
}());