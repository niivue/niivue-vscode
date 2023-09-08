(function () {
    const vscode = acquireVsCodeApi();
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
        // Write datypeCode and matrix size (nx, ny, nz) in a formatted string to message
        document.getElementById('MetaData').innerHTML = "datatype: " + datatypeCodeToString(meta.datatypeCode) + ", matrix size: " + meta.nx + " x " + meta.ny + " x " + meta.nz;
        // Add voxelsize to MetaData (dx, dy, dz) rounded to 2 decimal places
        document.getElementById('MetaData').innerHTML += ", voxelsize: " + meta.dx.toFixed(2) + " x " + meta.dy.toFixed(2) + " x " + meta.dz.toFixed(2);
        // Add timepoints to the MetaData if nt > 1
        if (meta.nt > 1) {
            document.getElementById('MetaData').innerHTML += ", timepoints: " + meta.nt;
        }
    }

    function handleIntensityChange(data) {
        document.getElementById("intensity").innerHTML = "&nbsp;&nbsp;" + data.string;
    }

    let aspectRatio = 1;
    function setAspectRatio(vol, viewType) {
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

    function resize(n) {
        const windowWidth = window.innerWidth - 50;
        const windowHeight = window.innerHeight - 60;

        let bestWidth = 0;
        for (nrow = 1; nrow <= n; nrow++) {
            const ncol = Math.ceil(n / nrow);
            const maxHeight = (windowHeight / nrow) - 20; // 17 is the height of the text
            const maxWidth = Math.min(windowWidth / ncol, maxHeight * aspectRatio);
            if (maxWidth > bestWidth) { bestWidth = maxWidth; }
        }
        for (i = 0; i < n; i++) {
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
            for (i = 1; i < names.length; i++) {
                if (names[i].slice(0, startCommon) !== chars) {
                    startCommon -= 1;
                    continue outer;
                }
            }
            break;
        }
        let endCommon = minLen;
        outer:
        while (endCommon > 0) {
            const chars = names[0].slice(-endCommon);
            for (i = 1; i < names.length; i++) {
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
        return names.map((name) => name.slice(startCommon, -endCommon));
    }

    function createCanvases(n, names) {
        for (i = 0; i < n; i++) {
            // Create a div that contains a name and a canvas
            const div = document.createElement("div");
            document.getElementById("container").appendChild(div);
            const textDiv = document.createElement("div");
            div.appendChild(textDiv);
            const text = document.createTextNode(names[i]);
            textDiv.appendChild(text);
            const canvas = document.createElement("canvas");
            div.appendChild(canvas);
            const cursorTextDiv = document.createElement("div");
            div.appendChild(cursorTextDiv);
            const cursorText = document.createTextNode(" ");
            cursorTextDiv.appendChild(cursorText);

            div.style.float = "left";
            textDiv.style.fontSize = "20px";
            textDiv.style.position = "absolute";
            canvas.id = "gl" + i;
            cursorTextDiv.id = "cursortext" + i;
        }
    }

    function createViewDropdown(nvArray) {
        const view = document.createElement("select");
        view.id = "view";
        view.innerHTML = "<option value='0'>Axial</option><option value='1'>Coronal</option><option value='2'>Sagittal</option><option value='3'>A+C+S+R</option><option value='4'>Render</option>";
        document.getElementById("footer").appendChild(view);
        view.addEventListener('change', () => {
            const val = parseInt(document.getElementById("view").value);
            // setAspectRatio(nvArray[0].volumes[0], val); // niivue keeps the aspect ratio
            nvArray.forEach((item) => item.setSliceType(val));
        });
    }

    function compareView(items) {
        const n = items.length;

        // Empty Container
        const container = document.getElementById("container");
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        // Empty nvArray
        nvArray.length = 0;

        setAspectRatio(new niivue.NVImage(items[0].data, items[0].uri), 0);
        const diffNames = differenceInNames(items.map((item) => item.uri));
        createCanvases(n, diffNames);
        resize(n);

        // Create new niivue with axial view for each volume
        for (i = 0; i < n; i++) {
            const textNode = document.getElementById("cursortext" + i);
            const handleIntensityChangeCompareView = (data) => {
                const parts = data.string.split("=");
                textNode.textContent = parts.pop();
                document.getElementById("intensity").innerHTML = parts.pop();
            };
            const nvTemp = new niivue.Niivue({ isResizeCanvas: false, onLocationChange: handleIntensityChangeCompareView });
            nvArray.push(nvTemp);
            nvTemp.attachTo("gl" + i);
            nvTemp.setSliceType(0);
            const volume = new niivue.NVImage(items[i].data, items[i].uri);
            nvTemp.addVolume(volume);
        }
        // Sync only in one direction, circular syncing causes problems
        for (i = 0; i < n - 1; i++) {
            nvArray[i].syncWith(nvArray[i + 1]);
        }

        createViewDropdown(nvArray);
        window.addEventListener("resize", () => resize(n));
        const addOverlayButton = document.getElementById("AddOverlayButton");
        addOverlayButton.parentNode.removeChild(addOverlayButton);
        showMetadata(nvArray[0].volumes[0]);
        showScaling();
    }

    function showScaling() {
        document.getElementById("minvalue").value = nvArray[0].volumes[0].cal_min.toPrecision(2);
        document.getElementById("maxvalue").value = nvArray[0].volumes[0].cal_max.toPrecision(2);
    }

    function adaptScaling() {
        const min = document.getElementById("minvalue").value;
        const max = document.getElementById("maxvalue").value;
        nvArray.forEach((niv) => { niv.volumes[0].cal_min = min; niv.volumes[0].cal_max = max; niv.updateGLVolume(); });
    }

    // Main
    const nvArray = [];
    nv = new niivue.Niivue({ isResizeCanvas: false, onLocationChange: handleIntensityChange });
    nv.attachTo("gl");
    nvArray.push(nv);

    document.getElementById("AddOverlayButton").addEventListener('click', () => {
        vscode.postMessage({
            type: 'addOverlay'
        });
    });

    document.getElementById("NearestInterpolation").addEventListener('change', () => {
        nvArray.forEach((item) => item.setInterpolation(document.getElementById("NearestInterpolation").checked));
    });

    document.getElementById("minvalue").addEventListener('change', () => {
        adaptScaling();
    });
    document.getElementById("maxvalue").addEventListener('change', () => {
        adaptScaling();
    });

    window.addEventListener('message', async (e) => {
        const { type, body } = e.data;
        switch (type) {
            case 'localDocument':
                {
                    const image = new niivue.NVImage(body.data, body.uri);
                    nv.addVolume(image);
                    showMetadata(nv.volumes[0]);
                    showScaling();
                }
                break;
            case 'webUrl':
                {
                    const volumeList = [body];
                    nv.loadVolumes(volumeList).then(function () {
                        showMetadata(nv.volumes[0]);
                    });
                    showScaling();
                }
                break;
            case 'overlay':
                {
                    const image = new niivue.NVImage(body.data, body.uri, 'redyell');
                    nv.addVolume(image);
                }
                break;
            case 'compare':
                {
                    compareView(body);
                }
        }
    });

    vscode.postMessage({ type: 'ready' });
}());