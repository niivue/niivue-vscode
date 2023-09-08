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

    // Main
    document.getElementById("AddOverlayButton").addEventListener('click', () => {
        vscode.postMessage({
            type: 'addOverlay'
        });
    });

    function getAspectRatio(vol, viewType) {
        const meta = vol.getImageMetadata();
        const xSize = meta.nx * meta.dx;
        const ySize = meta.ny * meta.dy;
        const zSize = meta.nz * meta.dz;
        if (viewType === 0) {
            return xSize / ySize;
        }
    }

    function resize(n, aspectRatio) {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight - 40;

        // let windowHeight = window.innerHeight;
        // const select = document.getElementById("view");
        // if (select) { windowHeight -= select.clientHeight; } else { windowHeight -= 25; }

        let bestWidth = 0;
        for (nrow = 1; nrow <= n; nrow++) {
            const ncol = Math.ceil(n / nrow);
            const maxHeight = windowHeight / nrow;
            const maxWidth = Math.min(windowWidth / ncol, maxHeight * aspectRatio);
            if (maxWidth > bestWidth) { bestWidth = maxWidth; }
        }
        for (i = 0; i < n; i++) {
            const canvas = document.getElementById("gl" + i);
            canvas.width = Math.floor(0.95 * bestWidth);
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

            div.style.float = "left";
            textDiv.style.fontSize = "20px";
            textDiv.style.position = "absolute";
            canvas.id = "gl" + i;
        }
    }

    function compareView(items) {
        const diffNames = differenceInNames(items.map((item) => item.uri));

        // Empty Container
        const container = document.getElementById("container");
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const n = items.length;
        const aspectRatio = getAspectRatio(new niivue.NVImage(items[0].data, items[0].uri), 0);

        createCanvases(n, diffNames);
        resize(n, aspectRatio);

        const nvArray = [];
        for (i = 0; i < n; i++) {
            // create new niivue with slice view
            const nvTemp = new niivue.Niivue({ isResizeCanvas: false });
            nvArray.push(nvTemp);
            nvTemp.attachTo("gl" + i);
            nvTemp.setSliceType(0);
            const image = new niivue.NVImage(items[i].data, items[i].uri);
            nvTemp.addVolume(image);
        }
        for (i = 0; i < n - 1; i++) {
            nvArray[i].syncWith(nvArray[i + 1]);
        }

        // Create view dropdown menu
        const view = document.createElement("select");
        view.id = "view";
        view.innerHTML = "<option value=0>Axial</option><option value=1>Coronal</option><option value=2>Sagittal</option>";
        container.appendChild(view);
        // Ddd event listener to view dropdown menu
        view.addEventListener('change', () => {
            const val = document.getElementById("view").value;
            nvArray.forEach((item) => item.setSliceType(val));
        });
        window.addEventListener("resize", () => resize(n, aspectRatio));
    }

    document.getElementById("NearestInterpolation").addEventListener('change', () => {
        nv.setInterpolation(document.getElementById("NearestInterpolation").checked);
    });

    const nv = new niivue.Niivue({ isResizeCanvas: false, onLocationChange: handleIntensityChange });
    nv.attachTo("gl");

    window.addEventListener('message', async (e) => {
        const { type, body } = e.data;
        switch (type) {
            case 'localDocument':
                {
                    const image = new niivue.NVImage(body.data, body.uri);
                    nv.addVolume(image);
                    showMetadata(nv.volumes[0]);
                }
                break;
            case 'webUrl':
                {
                    const volumeList = [body];
                    nv.loadVolumes(volumeList).then(function () {
                        showMetadata(nv.volumes[0]);
                    });
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