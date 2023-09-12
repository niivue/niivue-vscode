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
            const maxHeight = (windowHeight / nrow) - 20; // 17 is the height of the text
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
    function differenceInNames(names) {
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
        return names.map((name) => name.slice(startCommon, name.length - endCommon));
    }

    function createCanvases(n) {
        for (let i = 0; i < n; i++) {
            const div = document.getElementsByName("ViewTemplate")[0].cloneNode(true);
            div.removeAttribute("name");
            document.getElementById("container").appendChild(div);

            const htmlIndex = nCanvas;
            div.id = "Volume" + htmlIndex;
            div.style.display = "block";

            div.getElementsByTagName("canvas")[0].id = "gl" + htmlIndex;
            const subdivs = div.getElementsByTagName("div");
            subdivs[0].id = "name" + htmlIndex;
            subdivs[1].id = "cursortext" + htmlIndex;
            nCanvas += 1;
        }
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

        if (item.data) {
            const volume = new niivue.NVImage(item.data, item.uri);
            nv.addVolume(volume);
        } else {
            const volumeList = [{ url: item.uri }];
            await nv.loadVolumes(volumeList);
        }

        const textNode = document.getElementById("cursortext" + index);
        const handleIntensityChangeCompareView = (data) => {
            const parts = data.string.split("=");
            textNode.textContent = parts.pop();
            document.getElementById("intensity").textContent = parts.pop();
        };
        nv.onLocationChange = handleIntensityChangeCompareView;
        if (nvArray.length === 1) {
            setAspectRatio(nvArray[0].volumes[0]);
            resize();
            nvArray[0].updateGLVolume();
            showMetadata(nvArray[0].volumes[0]);
            showScaling();
        }

        // Sync only in one direction, circular syncing causes problems
        for (let i = 0; i < nvArray.length; i++) {
            nvArray[i].syncWith(nvArray[i + 1]);
        }
        setNames();
    }

    function setNames() {
        const diffNames = differenceInNames(nvArray.map((item) => decodeURIComponent(item.volumes[0].name)));
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

    function addOverlay(item) {
        const image = new niivue.NVImage(item.data, item.uri, 'redyell');
        nvArray[0].addVolume(image);
    }

    function addButtonListenersVscode() {
        const vscode = acquireVsCodeApi();
        document.getElementById("AddOverlayButton").addEventListener('click', () => {
            vscode.postMessage({
                type: 'addOverlay'
            });
        });
        document.getElementById("AddImagesButton").addEventListener('click', () => {
            vscode.postMessage({
                type: 'addImages'
            });
        });
        vscode.postMessage({ type: 'ready' });
    }

    function addButtonListenersWeb() {
        const fileTypes = '.nii,.nii.gz,.dcm,.mha,.mhd,.nhdr,.nrrd,.mgh,.mgz,.v,.v16,.vmr';
        document.getElementById("AddOverlayButton").addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = fileTypes;

            input.onchange = async (e) => {
                const file = e.target.files[0];
                file.arrayBuffer().then((data) => {
                    window.postMessage({
                        type: 'overlay',
                        body: {
                            data: data,
                            uri: file.name
                        }
                    });
                });
            };
            input.click();
        });

        document.getElementById("AddImagesButton").addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = fileTypes;

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
        });
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
        window.addEventListener("resize", () => resize());
        window.addEventListener('message', async (e) => {
            const { type, body } = e.data;
            switch (type) {
                case 'localDocument':
                    {
                        addImage(body);
                    }
                    break;
                case 'webUrl':
                    {
                        addImage({ uri: body.url });
                    }
                    break;
                case 'overlay':
                    {
                        addOverlay(body);
                    }
                    break;
                case 'compare':
                    {
                        setViewType(0); // Axial
                        addImage(body);
                    }
                case 'addImage':
                    {
                        setViewType(0); // Axial
                        addImage(body);
                    }
                case 'initCanvas':
                    {
                        createCanvases(body.n);
                    }
                    break;
            }
        });

        if (typeof acquireVsCodeApi === 'function') {
            addButtonListenersVscode();
        } else { // When running in a browser
            addButtonListenersWeb();
            // post webUrl message to window with default url
            window.postMessage({
                type: 'webUrl',
                body: {
                    url: 'https://niivue.github.io/niivue-demo-images/mni152.nii.gz'
                }
            });
        }
    }

    // Main - Globals
    const nvArray = [];
    let aspectRatio = 1;
    let viewType = 3; // all views
    let nCanvas = 0;
    setViewType(viewType);
    addListeners();

}());
