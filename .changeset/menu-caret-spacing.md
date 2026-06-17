---
'@niivue/react': patch
---

Tighten the spacing between a menu-bar label and its dropdown chevron.

The chevron sat ~24px from its label: the label button's 10px right padding, the
caret button's 10px left padding, and the arrow's own 4px `ms-1` margin all
stacked up, so each chevron looked detached from the setting it belonged to.

New `nv-topbtn-label` / `nv-topbtn-caret` modifier classes trim the inner padding
to 2px on each side (and the arrow's `ms-1` margin is dropped), so the chevron now
hugs its label while the normal 10px gap after the chevron is preserved.
