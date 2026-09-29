---
'niivue': patch
---

Load files from every folder of a multi-root workspace. The viewer itself now only fetches files inside the workspace folders; other files are still opened through the extension. Opening a folder whose files add up to more than 2 GB shows an error in the viewer, and a DICOM file in such a folder loads on its own with a warning. A folder that fails to open shows the error instead of an empty viewer.
