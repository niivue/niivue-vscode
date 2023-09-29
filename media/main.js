(function () {
    const { render, html, useRef, useState } = htmPreact;

    Header = () => html`
        <${ShowHeaderButton} />
        <span id="MetaData" style=${{padding: "0.3em"}}></span>
    `;

    ShowHeaderButton = () => {
        const dialog = useRef();
        const [text, setText] = useState('Header');

        const headerButtonClick = () => {
            setText(nvArray[0].volumes[0].hdr.toFormattedString());
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

    render(html`<${Header} />`, document.getElementById("header"));

    Footer = () => html`
        <div id="location"></div>
        <${AddImagesButton} />
        <${NearestInterpolation} />
        <${MinValue} />
        <${MaxValue} />
        <${SelectView} />
    `;

    AddImagesButton = () => html`<button id="AddImagesButton" onClick=${addImagesEvent}> Add Images </button>`;

    NearestInterpolation = () => html`
        <label for="NearestInterpolation">No Interpolation</label>
        <input type="checkbox" id="NearestInterpolation" />
    `;

    MinValue = () => html`
        <label for="minvalue">Min</label>
        <input type="number" id="minvalue" value="0" />
    `;

    MaxValue = () => html`
        <label for="maxvalue">Max</label>
        <input type="number" id="maxvalue" value="0" />
    `;

    SelectView = () => html`
        <select id="view">
            <option value="0">Axial</option>
            <option value="1">Coronal</option>
            <option value="2">Sagittal</option>
            <option value="3">A+C+S+R</option>
            <option value="4">Render</option>
        </select>
    `;

    render(html`<${Footer} />`, document.getElementById("footer"));

    // Functions
    function showMetadata(volume) {
        const meta = volume.getImageMetadata();
        document.getElementById('MetaData').innerHTML = "matrix size: " + meta.nx + " x " + meta.ny + " x " + meta.nz;
        document.getElementById('MetaData').innerHTML += ", voxelsize: " + meta.dx.toPrecision(2) + " x " + meta.dy.toPrecision(2) + " x " + meta.dz.toPrecision(2);
        if (meta.nt > 1) {
            document.getElementById('MetaData').innerHTML += ", timepoints: " + meta.nt;
        }
    }

    function setAspectRatio(vol) {
        const meta = vol.getImageMetadata();
        const xSize = meta.nx * meta.dx;
        const ySize = meta.ny * meta.dy;
        const zSize = meta.nz * meta.dz;
        if (state.viewType === 0) {
            state.aspectRatio = xSize / ySize;
        } else if (state.viewType === 1) {
            state.aspectRatio = xSize / zSize;
        } else if (state.viewType === 2) {
            state.aspectRatio = ySize / zSize;
        } else {
            state.aspectRatio = 1;
        }
    }

    function resize() {
        const windowWidth = window.innerWidth - 25;
        const windowHeight = window.innerHeight - 75;

        let bestWidth = 0;
        for (nrow = 1; nrow <= state.nCanvas; nrow++) {
            const ncol = Math.ceil(state.nCanvas / nrow);
            const maxHeight = (windowHeight / nrow);
            const maxWidth = Math.min(windowWidth / ncol, maxHeight * state.aspectRatio);
            if (maxWidth > bestWidth) { bestWidth = maxWidth; }
        }
        for (let i = 0; i < state.nCanvas; i++) {
            const canvas = document.getElementById("gl" + i);
            canvas.width = bestWidth;
            canvas.height = canvas.width / state.aspectRatio;
        }
    }

    // This function finds common patterns in the names and only returns the parts of the names that are different
    function differenceInNames(names, rec = true) {
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

    function createCanvases(n) {
        for (let i = 0; i < n; i++) {
            const imageIndex = state.nCanvas;

            const volume = document.getElementById("volumeTemplate").content.cloneNode(true).firstElementChild;
            volume.id = "volume" + imageIndex;
            document.getElementById("container").appendChild(volume);

            volume.getElementsByTagName("canvas")[0].id = "gl" + imageIndex;
            volume.getElementsByClassName("volume-name")[0].id = "volume-name" + imageIndex;
            volume.getElementsByClassName("volume-intensity")[0].id = "volume-intensity" + imageIndex;
            volume.getElementsByClassName("volume-footer")[0].id = "volume-footer" + imageIndex;
            volume.getElementsByClassName("volume-overlay-options")[0].id = "volume-overlay-options" + imageIndex;

            state.nCanvas += 1;

            addContextMenuListener(imageIndex);
        }
    }

    function addContextMenuListener(imageIndex) {
        const field = document.getElementById("volume-footer" + imageIndex);
        field.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const contextMenu = createContextMenu(imageIndex);
            contextMenu.style.display = "block";
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.style.top = `${e.clientY - contextMenu.offsetHeight}px`;
        });
    }

    function createContextMenu(imageIndex) {
        const div = document.getElementById("contextMenuTemplate").content.cloneNode(true).firstElementChild;
        const body = document.getElementsByTagName("body")[0];
        body.appendChild(div);

        function removeContextMenu() {
            body.removeChild(div);
            document.removeEventListener("click", removeContextMenu);
            document.removeEventListener("contextmenu", removeContextMenu);
        }
        // Remove context menu when clicking outside of it
        document.addEventListener("click", removeContextMenu);
        document.addEventListener("contextmenu", removeContextMenu);

        div.querySelector('[name="addOverlay"]').addEventListener("click", () => {
            addOverlayEvent(imageIndex, 'overlay');
            removeContextMenu();
        });

        if (nvArray.length > imageIndex) { // Is volume and not mesh // TODO is this correct?
            const nv = nvArray[imageIndex];
            if (nv.volumes.length < 2) {
                div.querySelector('[name="removeOverlay"]').style.display = "none";
                div.querySelector('[name="setOverlayScale"]').style.display = "none";
            } else {
                div.querySelector('[name="removeOverlay"]').addEventListener("click", () => {
                    nv.removeVolumeByIndex(1);
                    nv.updateGLVolume();
                    removeContextMenu();
                });
                div.querySelector('[name="setOverlayScale"]').addEventListener("click", () => {
                    const submenu = div.querySelector('[name="setOverlayScale"]').nextElementSibling; // TODO this is a hack
                    submenu.style.display = "block";
                    nv.colormaps().forEach((cmap) => {
                        const cmapItem = document.createElement("div");
                        cmapItem.className = "context-menu-item";
                        cmapItem.textContent = cmap;
                        cmapItem.addEventListener("click", () => nv.setColormap(nv.volumes[1].id, cmap));
                        submenu.appendChild(cmapItem);
                    });
                });
            }
            if (nv.meshes.length >= 1) {
                div.querySelector('[name="addMeshOverlay"]').addEventListener("click", () => {
                    addOverlayEvent(imageIndex, 'addMeshOverlay');
                    removeContextMenu();
                });
                div.querySelector('[name="addMeshCurvature"]').addEventListener("click", () => {
                    addOverlayEvent(imageIndex, 'addMeshCurvature');
                    removeContextMenu();
                });
                if (nv.meshes[0].layers.length >= 1) {
                    div.querySelector('[name="replaceMeshOverlay"]').addEventListener("click", () => {
                        addOverlayEvent(imageIndex, 'replaceMeshOverlay');
                        removeContextMenu();
                    });
                } else {
                    div.querySelector('[name="replaceMeshOverlay"]').style.display = "none";
                }
            } else {
                div.querySelector('[name="addMeshOverlay"]').style.display = "none";
                div.querySelector('[name="addMeshCurvature"]').style.display = "none";
                div.querySelector('[name="replaceMeshOverlay"]').style.display = "none";
            }
        }
        return div;
    }

    function isImageType(item) {
        const fileTypesArray = imageFileTypes.split(',');
        return fileTypesArray.find((fileType) => item.uri.endsWith(fileType));
    }

    async function addImage(item) {
        if (state.nCanvas < state.nTotalCanvas) {
            createCanvases(state.nTotalCanvas - state.nCanvas);
        }
        const index = nvArray.length;
        if (!document.getElementById("volume" + index)) { createCanvases(1); }
        resize(index);
        setViewType(state.viewType);

        const nv = new niivue.Niivue({ isResizeCanvas: false });
        nvArray.push(nv);

        nv.attachTo("gl" + index);
        nv.setSliceType(state.viewType);

        if (isImageType(item)) {
            if (item.data) {
                const volume = new niivue.NVImage(item.data, item.uri);
                nv.addVolume(volume);
            } else {
                const volumeList = [{ url: item.uri }];
                await nv.loadVolumes(volumeList);
            }
        } else {
            if (item.data) {
                const mesh = await niivue.NVMesh.readMesh(item.data, item.uri, nv.gl);
                nv.addMesh(mesh);
            } else {
                const meshList = [{ url: item.uri }];
                await nv.loadMeshes(meshList);
            }
        }
        if (state.scaling.isManual && nv.volumes.length > 0) {
            nv.volumes[0].cal_min = state.scaling.min;
            nv.volumes[0].cal_max = state.scaling.max;
        }
        const textNode = document.getElementById("volume-intensity" + index);
        const handleIntensityChangeCompareView = (data) => {
            const parts = data.string.split("=");
            textNode.textContent = parts.pop();
            document.getElementById("location").textContent = parts.pop();
        };
        nv.onLocationChange = handleIntensityChangeCompareView;
        nv.createOnLocationChange();
        if (nvArray.length === 1 && nvArray[0].volumes.length > 0) {
            initializationFirstVolume();
        }

        // Sync only in one direction, circular syncing causes problems
        for (let i = 0; i < nvArray.length; i++) {
            nvArray[i].syncWith(nvArray[i + 1]);
        }
        setNames();
    }

    function initializationFirstVolume() {
        setAspectRatio(nvArray[0].volumes[0]);
        resize();
        nvArray[0].updateGLVolume();
        showMetadata(nvArray[0].volumes[0]);
        initializeMinMaxInput();
    }

    function initializeMinMaxInput() {
        const stepSize = (nvArray[0].volumes[0].cal_max - nvArray[0].volumes[0].cal_min) / 10;
        document.getElementById("minvalue").value = nvArray[0].volumes[0].cal_min.toPrecision(2);
        document.getElementById("maxvalue").value = nvArray[0].volumes[0].cal_max.toPrecision(2);
        document.getElementById("minvalue").step = stepSize.toPrecision(2);
        document.getElementById("maxvalue").step = stepSize.toPrecision(2);
    }

    function getNames() {
        return nvArray.map((item) => {
            if (item.volumes.length > 0) {
                return decodeURIComponent(item.volumes[0].name);
            } else {
                return decodeURIComponent(item.meshes[0].name);
            }
        });
    }

    function setNames() {
        const diffNames = differenceInNames(getNames());
        for (let i = 0; i < diffNames.length; i++) {
            document.getElementById("volume-name" + i).textContent = diffNames[i].slice(-25); // about 10px per character
        }
    }

    function setViewType(type) {
        state.viewType = type;
        document.getElementById("view").value = state.viewType;
        document.getElementById("view").dispatchEvent(new Event('change'));
    }

    function changeScalingEvent() {
        state.scaling.isManual = true;
        state.scaling.min = document.getElementById("minvalue").value;
        state.scaling.max = document.getElementById("maxvalue").value;
        applyScaling();
    }

    function applyScaling() {
        nvArray.forEach((niv) => {
            niv.volumes[0].cal_min = state.scaling.min;
            niv.volumes[0].cal_max = state.scaling.max;
            niv.updateGLVolume();
        });
    }

    function addMeshOverlay(item, type) {
        const nv = nvArray[item.index];
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
        niivue.NVMesh.readLayer(item.uri, item.data, mesh, a.opacity, a.colormap, a.colormapNegative, a.useNegativeCmap, a.calMin, a.calMax);
        mesh.updateMesh(nv.gl);
        nv.opts.isColorbar = true;
        nv.updateGLVolume();
        const layerNumber = nv.meshes[0].layers.length - 1;
        const layer = nv.meshes[0].layers[layerNumber];
        if (type === "curvature") {
            nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "colorbarVisible", false);
        }
        if (type === "overlay") {
            document.getElementById("volume-overlay-options" + item.index).style.display = "block";
            const minInput = document.getElementById("overlay-minvalue");
            const maxInput = document.getElementById("overlay-maxvalue");
            minInput.step = ((scaling.max - scaling.min) / 10).toPrecision(2);
            maxInput.step = ((scaling.max - scaling.min) / 10).toPrecision(2);
            minInput.addEventListener('change', () => {
                nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "cal_min", minInput.value.toPrecision(2));
                nv.updateGLVolume();
                minInput.step = ((scaling.max - scaling.min) / 10).toPrecision(2);
            });
            maxInput.addEventListener('change', () => {
                nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "cal_max", maxInput.value.toPrecision(2));
                nv.updateGLVolume();
                maxInput.step = ((scaling.max - scaling.min) / 10).toPrecision(2);
            });
            const colormap = document.getElementById("overlay-colormap");
            colormap.value = a.colormap;
            colormap.addEventListener('change', () => {
                if (colormap.value === "symmetric") {
                    nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "useNegativeCmap", true);
                    nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "colormap", "warm");
                    nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "colormapNegative", "winter");
                } else {
                    nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "useNegativeCmap", false);
                    nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "colormap", colormap.value);
                    nv.setMeshLayerProperty(nv.meshes[0].id, layerNumber, "colormapNegative", "");
                }
                nv.updateGLVolume();
            });
        }
    }

    async function addOverlay(item) {
        const nv = nvArray[item.index];
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
                    file.arrayBuffer().then((data) => {
                        window.postMessage({
                            type: 'addImage',
                            body: {
                                data: data,
                                uri: file.name
                            }
                        });
                    });
                }
            };
            input.click();
        }
    }

    function addListeners() {
        document.getElementById("NearestInterpolation").addEventListener('change', () => {
            nvArray.forEach((item) => item.setInterpolation(document.getElementById("NearestInterpolation").checked));
        });
        document.getElementById("minvalue").addEventListener('change', () => {
            changeScalingEvent();
        });
        document.getElementById("maxvalue").addEventListener('change', () => {
            changeScalingEvent();
        });
        document.getElementById("view").addEventListener('change', () => {
            const val = parseInt(document.getElementById("view").value);
            nvArray.forEach((item) => item.setSliceType(val));
        });
        window.addEventListener("resize", () => resize());
        window.addEventListener('message', async (e) => {
            const { type, body } = e.data;
            switch (type) {
                case 'addMeshOverlay':
                    {
                        addMeshOverlay(body, "overlay");
                    }
                    break;
                case 'addMeshCurvature':
                    {
                        addMeshOverlay(body, "curvature");
                    }
                    break;
                case 'replaceMeshOverlay':
                    {
                        addMeshOverlay(body, "replaceOverlay");
                    }
                    break;
                case 'overlay':
                    {
                        addOverlay(body);
                    }
                    break;
                case 'addImage':
                    {
                        addImage(body);
                    }
                    break;
                case 'initCanvas':
                    {
                        setViewType(0); // Axial
                        state.nTotalCanvas += body.n;
                    }
                    break;
            }
        });
    }

    // Main - Globals
    if (typeof acquireVsCodeApi === 'function') {
        var vscode = acquireVsCodeApi();
    }
    const imageFileTypes = '.nii,.nii.gz,.dcm,.mha,.mhd,.nhdr,.nrrd,.mgh,.mgz,.v,.v16,.vmr';
    const nvArray = [];
    const state = {
        aspectRatio: 1,
        viewType: 3, // all views
        nCanvas: 0,
        nTotalCanvas: 0,
        interpolation: true,
        scaling: {
            isManual: false,
            min: 0,
            max: 0,
        }
    };
    setViewType(state.viewType);
    addListeners();

    if (typeof vscode === 'object') {
        vscode.postMessage({ type: 'ready' });
    } else { // Running in browser
        window.postMessage({
            type: 'addImage',
            body: { uri: 'https://niivue.github.io/niivue/images/mni152.nii.gz' }
        });
    }
}());
