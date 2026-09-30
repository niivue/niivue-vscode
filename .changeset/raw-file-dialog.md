---
'@niivue/react': patch
---

Fix opening headerless `.raw` files (the size and data type entered are applied and the image data is loaded), and `.mhd`/`.mha` images and overlays without a `TransformMatrix`, which showed NaN positions or did not draw.
