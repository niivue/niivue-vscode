---
"@niivue/streamlit": patch
---

Streamlit component performance follow-ups:

- Diff-guard the settings sync in `useStreamlitNiivue` so repeated Streamlit
  re-runs with unchanged settings no longer trigger
  `setInterpolation` / `setCrosshairWidth` / `drawScene` in `NiiVueCanvas`.
- Update the bundled demos to use `@st.cache_data` for NIfTI loading and
  `@st.fragment` for the bidirectional demo, and pass `update_interval_ms=None`
  in demos that don't consume the return value.
- Document the three performance knobs (`@st.fragment`, `@st.cache_data`,
  `update_interval_ms`) in the Streamlit component README.
