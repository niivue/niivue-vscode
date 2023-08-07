var nv = new niivue.Niivue({ isResizeCanvas: false });
nv.attachTo("gl");

window.addEventListener('message', async (e) => {
    const { type, body } = e.data;
    switch (type) {
        case 'init':
            {
                let image = new niivue.NVImage(body.data, body.uri);
                nv.addVolume(image);
            }
            break;
    }
});