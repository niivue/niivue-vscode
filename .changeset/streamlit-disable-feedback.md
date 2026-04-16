---
"@niivue/streamlit": patch
---

Add `update_interval_ms` parameter to `niivue_viewer()`. Passing `None`
disables click/drag feedback to Python entirely, restoring the low-latency
behaviour of the pre-overlay viewer. Defaults to `100` (current throttle).
