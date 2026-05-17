---
"@niivue/streamlit": patch
---

Streamlit component performance follow-ups:

- Use a content-fingerprint key on the settings sync in `useStreamlitNiivue`
  so repeated Streamlit re-runs with unchanged settings no longer trigger
  `setInterpolation` / `setCrosshairWidth` / `drawScene` in `NiiVueCanvas`.
- Cache the base64 encoding of NIfTI / overlay / mesh bytes inside the
  Python wrapper (keyed on bytes identity), so repeated calls with the same
  loader output skip the encode entirely. Combined with a user-level
  `@st.cache_data` loader this removes both file I/O and ~25 MB/scan of
  re-encoding on every fragment re-run.
- Update the bundled demos to use `@st.cache_data` for NIfTI loading and
  `@st.fragment` for the bidirectional demo, and pass `update_interval_ms=None`
  in demos that don't consume the return value.
- Document the three performance knobs (`@st.fragment`, `@st.cache_data`,
  `update_interval_ms`) in the Streamlit component README.
