// Stand-in for the `dcm2niix-worker` virtual module that vite.config.ts builds
// (it inlines the dcm2niix worker + wasm into a Blob URL). Vitest does not run
// that plugin, so tests importing NiiVueCanvas need this alias to resolve.
export default 'blob:dcm2niix-worker-stub'
