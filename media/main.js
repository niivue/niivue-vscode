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

// Main
var nv = new niivue.Niivue({ isResizeCanvas: false });
nv.attachTo("gl");

window.addEventListener('message', async (e) => {
    const { type, body } = e.data;
    switch (type) {
        case 'init':
            {
                let image = new niivue.NVImage(body.data, body.uri);
                nv.addVolume(image)
                meta = nv.volumes[0].getImageMetadata();
                // Write datypeCode and matrix size (nx, ny, nz) in a formatted string to message
                document.getElementById('MetaData').innerHTML = "datatype: " + datatypeCodeToString(meta.datatypeCode) + ", matrix size: " + meta.nx + " x " + meta.ny + " x " + meta.nz;
                // Add voxelsize to MetaData (dx, dy, dz) rounded to 2 decimal places
                document.getElementById('MetaData').innerHTML += ", voxelsize: " + meta.dx.toFixed(2) + " x " + meta.dy.toFixed(2) + " x " + meta.dz.toFixed(2);
                // Add timepoints to the MetaData if nt > 1
                if (meta.nt > 1) {
                    document.getElementById('MetaData').innerHTML += ", timepoints: " + meta.nt;
                }
            }
            break;
    }
});