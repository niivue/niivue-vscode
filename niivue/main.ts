import { Niivue, NVImage } from '@niivue/niivue';

let nv = new Niivue({ isResizeCanvas: false });
nv.attachTo("gl");

// https://stackoverflow.com/questions/41336301/typescript-cannot-find-name-window-or-document
window.addEventListener('message', async (e) => {
    const { type, body } = e.data;
    switch (type) {
        case 'init':
            {
                let image = new NVImage(body.data, body.uri);
                nv.addVolume(image);
            }
            break;
    }
});