---
'@niivue/streamlit': patch
---

Speed up re-runs: unchanged settings no longer redraw the viewer, and the same image bytes are not encoded again. The README explains how `@st.cache_data`, `@st.fragment` and `update_interval_ms` help.
