(function () {
    // Utility
    function datatypeCodeToString(datatypeCode) {
        switch (datatypeCode) {
            case 0:
                return "unknown";
            case 1:
                return "binary";
            case 2:
                return "uint8";
            case 4:
                return "int16";
            case 8:
                return "int32";
            case 16:
                return "float32";
            case 32:
                return "complex64";
            case 64:
                return "float64";
            case 128:
                return "rgb24";
            case 255:
                return "all";
            case 256:
                return "int8";
            case 512:
                return "uint16";
            case 768:
                return "uint32";
            case 1024:
                return "int64";
            case 1280:
                return "uint64";
            case 1536:
                return "float128";
            case 1792:
                return "complex128";
            case 2048:
                return "complex256";
            case 2304:
                return "rgba32";
            default:
                return "unknown datatype code";
        }
    }

    function showMetadata(volume) {
        const meta = volume.getImageMetadata();
        document.getElementById('MetaData').innerHTML = "datatype: " + datatypeCodeToString(meta.datatypeCode) + ", matrix size: " + meta.nx + " x " + meta.ny + " x " + meta.nz;
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
        if (viewType === 0) {
            aspectRatio = xSize / ySize;
        } else if (viewType === 1) {
            aspectRatio = xSize / zSize;
        } else if (viewType === 2) {
            aspectRatio = ySize / zSize;
        } else {
            aspectRatio = 1;
        }
    }

    function resize() {
        const windowWidth = window.innerWidth - 50;
        const windowHeight = window.innerHeight - 75;

        let bestWidth = 0;
        for (nrow = 1; nrow <= nCanvas; nrow++) {
            const ncol = Math.ceil(nCanvas / nrow);
            const maxHeight = (windowHeight / nrow); // - 25; // 17 is the height of the text
            const maxWidth = Math.min(windowWidth / ncol, maxHeight * aspectRatio);
            if (maxWidth > bestWidth) { bestWidth = maxWidth; }
        }
        for (let i = 0; i < nCanvas; i++) {
            const canvas = document.getElementById("gl" + i);
            canvas.width = bestWidth;
            canvas.height = canvas.width / aspectRatio;
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
        while (endCommon > 0 && names[0].slice(-endCommon, -endCommon + 1) >= '0' && names[0].slice(-endCommon, -endCommon + 1) <= '9') {
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
            const div = document.getElementsByName("ViewTemplate")[0].cloneNode(true);
            div.removeAttribute("name");
            document.getElementById("container").appendChild(div);

            const imageIndex = nCanvas;
            div.id = "Volume" + imageIndex;
            div.style.display = "block";

            div.getElementsByTagName("canvas")[0].id = "gl" + imageIndex;
            div.getElementsByClassName("volume-name")[0].id = "name" + imageIndex;
            div.getElementsByClassName("intensity")[0].id = "intensity" + imageIndex;
            div.getElementsByClassName("image-footer")[0].id = "image-footer" + imageIndex;
            nCanvas += 1;

            addContextMenuListener(imageIndex);
        }
    }

    function addContextMenuListener(imageIndex) {
        const field = document.getElementById("image-footer" + imageIndex);
        field.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            const contextMenu = createContextMenu(imageIndex);
            contextMenu.style.display = "block";
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.style.top = `${e.clientY - contextMenu.offsetHeight}px`;
        });
    }

    function createContextMenu(imageIndex) {
        const div = document.getElementsByName("ContextMenuTemplate")[0].cloneNode(true);
        div.removeAttribute("name");
        const body = document.getElementsByTagName("body")[0];
        body.appendChild(div);

        function removeContextMenu() {
            body.removeChild(div);
            document.removeEventListener("click", removeContextMenu);
        }
        // Remove context menu when clicking outside of it
        document.addEventListener("click", removeContextMenu);

        div.addEventListener("click", (e) => e.stopPropagation());

        div.querySelector('[name="addOverlay"]').addEventListener("click", () => {
            addOverlayEvent(imageIndex);
            removeContextMenu();
        });

        if (nvArray.length > imageIndex && nvArray[imageIndex].volumes.length < 2) {
            div.querySelector('[name="removeOverlay"]').style.display = "none";
            div.querySelector('[name="setOverlayScale"]').style.display = "none";
        } else {
            div.querySelector('[name="removeOverlay"]').addEventListener("click", () => {
                nvArray[imageIndex].removeVolumeByIndex(1);
                nvArray[imageIndex].updateGLVolume();
                removeContextMenu();
            });
            // div.querySelector('[name="setOverlayScale"]').addEventListener("click", () => {

            //     removeContextMenu();
            // });
        }
        return div;
    }

    function isImageType(item) {
        const fileTypesArray = imageFileTypes.split(',');
        return fileTypesArray.find((fileType) => item.uri.endsWith(fileType));
    }

    async function addImage(item) {
        const index = nvArray.length;
        if (!document.getElementById("Volume" + index)) { createCanvases(1); }
        resize(index);
        setViewType(viewType);

        const nv = new niivue.Niivue({ isResizeCanvas: false });
        nvArray.push(nv);

        nv.attachTo("gl" + index);
        nv.setSliceType(viewType);

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

        const textNode = document.getElementById("intensity" + index);
        const handleIntensityChangeCompareView = (data) => {
            const parts = data.string.split("=");
            textNode.textContent = parts.pop();
            document.getElementById("intensity").textContent = parts.pop();
        };
        nv.onLocationChange = handleIntensityChangeCompareView;
        if (nvArray.length === 1) {
            if (nvArray[0].volumes.length > 0) {
                setAspectRatio(nvArray[0].volumes[0]);
                resize();
                nvArray[0].updateGLVolume();
                showMetadata(nvArray[0].volumes[0]);
                showScaling();
            }
        }

        // Sync only in one direction, circular syncing causes problems
        for (let i = 0; i < nvArray.length; i++) {
            nvArray[i].syncWith(nvArray[i + 1]);
        }
        setNames();
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
            document.getElementById("name" + i).textContent = diffNames[i].slice(-25); // about 10px per character
        }
    }

    function setViewType(type) {
        viewType = type;
        document.getElementById("view").value = viewType;
        document.getElementById("view").dispatchEvent(new Event('change'));
    }

    function showScaling() {
        document.getElementById("minvalue").value = nvArray[0].volumes[0].cal_min.toPrecision(2);
        document.getElementById("maxvalue").value = nvArray[0].volumes[0].cal_max.toPrecision(2);
    }

    function adaptScaling() {
        const min = document.getElementById("minvalue").value;
        const max = document.getElementById("maxvalue").value;
        nvArray.forEach((niv) => {
            niv.volumes[0].cal_min = min;
            niv.volumes[0].cal_max = max;
            niv.updateGLVolume();
        });
    }

    async function addOverlay(item) {
        if (isImageType(item)) {
            const image = new niivue.NVImage(item.data, item.uri, 'redyell', 0.5);
            nvArray[item.index].addVolume(image);
        } else {
            const mesh = await niivue.NVMesh.readMesh(item.data, item.uri, nvArray[item.index].gl, 0.5);
            nvArray[item.index].addMesh(mesh);
        }
    }

    function addOverlayEvent(imageIndex) {
        if (typeof vscode === 'object') {
            vscode.postMessage({ type: 'addOverlay', body: { index: imageIndex } });
        } else {
            const input = document.createElement('input');
            input.type = 'file';

            input.onchange = async (e) => {
                const file = e.target.files[0];
                file.arrayBuffer().then((data) => {
                    window.postMessage({
                        type: 'overlay',
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
            adaptScaling();
        });
        document.getElementById("maxvalue").addEventListener('change', () => {
            adaptScaling();
        });
        document.getElementById("view").addEventListener('change', () => {
            const val = parseInt(document.getElementById("view").value);
            nvArray.forEach((item) => item.setSliceType(val));
        });
        document.getElementById("header-info-button").addEventListener('click', () => {
            const headerInfo = document.getElementById("header-info");
            while (headerInfo.firstChild) {
                headerInfo.removeChild(headerInfo.firstChild);
            }
            const lines = nvArray[0].volumes[0].hdr.toFormattedString().split('\n');
            lines.forEach((line) => {
                const div = document.createElement('div');
                div.textContent = line;
                headerInfo.appendChild(div);
            });
            document.getElementById("header-info-dialog").showModal();
        });
        window.addEventListener("resize", () => resize());
        window.addEventListener('message', async (e) => {
            const { type, body } = e.data;
            switch (type) {
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
                        createCanvases(body.n);
                    }
                    break;
            }
        });
        document.getElementById("AddImagesButton").addEventListener('click', addImagesEvent);
    }

    // Main - Globals
    if (typeof acquireVsCodeApi === 'function') {
        var vscode = acquireVsCodeApi();
    }
    const imageFileTypes = '.nii,.nii.gz,.dcm,.mha,.mhd,.nhdr,.nrrd,.mgh,.mgz,.v,.v16,.vmr';
    const nvArray = [];
    let aspectRatio = 1;
    let viewType = 3; // all views
    let nCanvas = 0;
    setViewType(viewType);
    addListeners();

    if (typeof vscode === 'object') {
        vscode.postMessage({ type: 'ready' });
    } else { // Running in browser
        window.postMessage({
            type: 'addImage',
            body: { uri: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz' }
        });
    }

}());
