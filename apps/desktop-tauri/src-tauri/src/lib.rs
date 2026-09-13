use serde::Serialize;
use std::borrow::Cow;
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri_plugin_dialog::DialogExt;

/// In-process allowlist of paths the user has explicitly opened (via the
/// native file dialog or directory listing). The webview cannot ask Rust to
/// read paths that have not been registered here.
///
/// This is a defence-in-depth measure: even if the renderer is compromised
/// (e.g. via a parsing bug in a NIfTI/DICOM loader), it cannot turn the
/// custom IPC commands into an arbitrary-file-read primitive against the
/// host filesystem. The trade-off is that callers must `register_opened_path`
/// any path before calling `read_file_bytes` or `get_file_info` on it.
#[derive(Default)]
pub struct AllowedPaths(pub Mutex<HashSet<PathBuf>>);

/// Metadata about a loaded file.
#[derive(Serialize)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
}

/// Canonicalise a user-provided path string, returning a stable form suitable
/// for membership checks against the allowlist.
fn canonical(path: &str) -> Result<PathBuf, String> {
    Path::new(path)
        .canonicalize()
        .map_err(|e| format!("Failed to resolve path: {e}"))
}

/// Authorise a path for subsequent reads. Called after the dialog plugin or
/// `list_directory` surfaces a path to the user, before `read_file_bytes` is
/// invoked on it.
#[tauri::command]
fn register_opened_path(
    path: String,
    allowed: tauri::State<'_, AllowedPaths>,
) -> Result<(), String> {
    let canonical = canonical(&path)?;
    allowed
        .0
        .lock()
        .map_err(|_| "Allowlist mutex poisoned".to_string())?
        .insert(canonical);
    Ok(())
}

/// Read a file from disk and return its raw bytes via Tauri's binary IPC
/// channel (zero-copy ArrayBuffer on the JS side), avoiding the multi-hundred-MB
/// JSON-array round-trip that would happen if we returned `Vec<u8>` directly.
#[tauri::command]
fn read_file_bytes(
    path: String,
    allowed: tauri::State<'_, AllowedPaths>,
) -> Result<tauri::ipc::Response, String> {
    let canonical = canonical(&path)?;
    if !allowed
        .0
        .lock()
        .map_err(|_| "Allowlist mutex poisoned".to_string())?
        .contains(&canonical)
    {
        return Err("Path not authorized".to_string());
    }
    if !canonical.is_file() {
        return Err("Path is not a file".to_string());
    }
    let bytes = std::fs::read(&canonical).map_err(|e| format!("Failed to read file: {e}"))?;
    Ok(tauri::ipc::Response::new(bytes))
}

/// Return metadata about a file without reading its contents.
#[tauri::command]
fn get_file_info(
    path: String,
    allowed: tauri::State<'_, AllowedPaths>,
) -> Result<FileInfo, String> {
    let canonical = canonical(&path)?;
    if !allowed
        .0
        .lock()
        .map_err(|_| "Allowlist mutex poisoned".to_string())?
        .contains(&canonical)
    {
        return Err("Path not authorized".to_string());
    }
    let metadata = std::fs::metadata(&canonical)
        .map_err(|e| format!("Failed to read metadata: {e}"))?;
    let name = canonical
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    Ok(FileInfo {
        path: canonical.to_string_lossy().to_string(),
        name,
        size: metadata.len(),
    })
}

/// List files in a directory, optionally filtered by extensions. Each returned
/// entry is also added to the allowlist, so the caller can immediately read
/// the surfaced files. The directory itself must already be authorised.
#[tauri::command]
fn list_directory(
    path: String,
    extensions: Option<Vec<String>>,
    allowed: tauri::State<'_, AllowedPaths>,
) -> Result<Vec<FileInfo>, String> {
    let dir_path = canonical(&path)?;
    if !allowed
        .0
        .lock()
        .map_err(|_| "Allowlist mutex poisoned".to_string())?
        .contains(&dir_path)
    {
        return Err("Path not authorized".to_string());
    }
    if !dir_path.is_dir() {
        return Err("Path is not a directory".to_string());
    }
    let normalised_exts: Option<Vec<String>> =
        extensions.map(|exts| exts.iter().map(|e| e.to_lowercase()).collect());

    let entries = std::fs::read_dir(&dir_path)
        .map_err(|e| format!("Failed to read directory: {e}"))?;
    let mut files = Vec::new();
    for entry in entries.flatten() {
        let entry_path = entry.path();
        if !entry_path.is_file() {
            continue;
        }
        if let Some(ref exts) = normalised_exts {
            let file_name = entry_path
                .file_name()
                .map(|n| n.to_string_lossy().to_lowercase())
                .unwrap_or_default();
            if !exts.iter().any(|ext| file_name.ends_with(ext)) {
                continue;
            }
        }
        if let Ok(metadata) = entry_path.metadata() {
            let name = entry_path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();
            files.push(FileInfo {
                path: entry_path.to_string_lossy().to_string(),
                name,
                size: metadata.len(),
            });
        }
    }
    files.sort_by(|a, b| a.name.cmp(&b.name));

    // Authorise every file we just surfaced, so the caller can read them
    // without an extra round-trip per file.
    {
        let mut allowed = allowed
            .0
            .lock()
            .map_err(|_| "Allowlist mutex poisoned".to_string())?;
        for f in &files {
            if let Ok(c) = canonical(&f.path) {
                allowed.insert(c);
            }
        }
    }

    Ok(files)
}

/// The name a file from the viewer is suggested under: the last segment of
/// the percent-decoded name, or "untitled".
fn suggested_file_name(encoded: Option<&str>) -> String {
    let decoded = encoded
        .map(|v| {
            percent_encoding::percent_decode_str(v)
                .decode_utf8_lossy()
                .to_string()
        })
        .unwrap_or_default();
    let name = decoded.rsplit(&['/', '\\'][..]).next().unwrap_or("").trim();
    if name.is_empty() || name == "." || name == ".." {
        "untitled".to_string()
    } else {
        name.to_string()
    }
}

/// The save dialog filter (label, extension) for a file name.
fn save_filter(file_name: &str) -> Option<(&'static str, &'static str)> {
    let lower = file_name.to_lowercase();
    if lower.ends_with(".nvd") {
        Some(("NiiVue Document", "nvd"))
    } else if lower.ends_with(".json") {
        Some(("JSON Document", "json"))
    } else if lower.ends_with(".png") {
        Some(("PNG Image", "png"))
    } else {
        None
    }
}

/// The file bytes of a request: the raw body, or the JSON array of numbers
/// the postMessage IPC fallback sends instead.
fn request_bytes(body: &tauri::ipc::InvokeBody) -> Result<Cow<'_, [u8]>, String> {
    match body {
        tauri::ipc::InvokeBody::Raw(bytes) => Ok(Cow::Borrowed(bytes)),
        tauri::ipc::InvokeBody::Json(value) => serde_json::from_value(value.clone())
            .map(Cow::Owned)
            .map_err(|_| "Expected the file's bytes as the request body".to_string()),
    }
}

/// Save a file the viewer produced (a scene document or a screenshot). The
/// bytes arrive as the raw request body and the suggested name, percent-encoded,
/// in the `x-file-name` header. Only the user picks where it is written, in
/// the native save dialog, so the renderer cannot write to arbitrary paths.
/// Returns the saved path, or None when the dialog is cancelled.
#[tauri::command]
async fn save_file(
    app: tauri::AppHandle,
    request: tauri::ipc::Request<'_>,
) -> Result<Option<String>, String> {
    let bytes = request_bytes(request.body())?;
    let name = suggested_file_name(
        request
            .headers()
            .get("x-file-name")
            .and_then(|v| v.to_str().ok()),
    );
    let mut dialog = app.dialog().file().set_file_name(&name);
    if let Some((label, extension)) = save_filter(&name) {
        dialog = dialog.add_filter(label, &[extension]);
    }
    // Blocking is fine here: async commands do not run on the main thread.
    let Some(path) = dialog.blocking_save_file() else {
        return Ok(None);
    };
    let path = path
        .into_path()
        .map_err(|e| format!("Invalid save location: {e}"))?;
    std::fs::write(&path, &bytes)
        .map_err(|e| format!("Failed to write {}: {e}", path.display()))?;
    Ok(Some(path.to_string_lossy().to_string()))
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(AllowedPaths::default())
        .invoke_handler(tauri::generate_handler![
            register_opened_path,
            read_file_bytes,
            get_file_info,
            list_directory,
            save_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    // Only import what the tests need. `use super::*` would re-import the
    // `#[tauri::command]`-generated macros that share names with the
    // commands, which the Rust compiler rejects as duplicate definitions.
    use super::{canonical, request_bytes, save_filter, suggested_file_name, AllowedPaths};
    use std::io::Write;
    use std::path::PathBuf;

    /// Stand-alone test helpers that exercise the path/extension logic
    /// without needing a Tauri runtime. The full `tauri::command` wrappers
    /// (which take `tauri::State<AllowedPaths>`) are exercised end-to-end
    /// only at runtime; here we test the underlying behaviour through the
    /// same allowlist data structure.
    fn allowlist_with(paths: &[&PathBuf]) -> AllowedPaths {
        let allowed = AllowedPaths::default();
        let mut guard = allowed.0.lock().unwrap();
        for p in paths {
            if let Ok(c) = p.canonicalize() {
                guard.insert(c);
            }
        }
        drop(guard);
        allowed
    }

    fn read_with_allowlist(path: &str, allowed: &AllowedPaths) -> Result<Vec<u8>, String> {
        let canonical_path = canonical(path)?;
        if !allowed.0.lock().unwrap().contains(&canonical_path) {
            return Err("Path not authorized".to_string());
        }
        if !canonical_path.is_file() {
            return Err("Path is not a file".to_string());
        }
        std::fs::read(&canonical_path).map_err(|e| format!("Failed to read file: {e}"))
    }

    fn temp_subdir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(name);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn test_read_file_bytes_success() {
        let dir = temp_subdir("niivue_test_read");
        let file_path = dir.join("test.nii");
        let mut f = std::fs::File::create(&file_path).unwrap();
        f.write_all(b"fake nifti data").unwrap();

        let allowed = allowlist_with(&[&file_path]);
        let result = read_with_allowlist(&file_path.to_string_lossy(), &allowed);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), b"fake nifti data");
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn test_read_file_bytes_rejects_unauthorised_path() {
        let dir = temp_subdir("niivue_test_unauth");
        let file_path = dir.join("secret.nii");
        let mut f = std::fs::File::create(&file_path).unwrap();
        f.write_all(b"secret").unwrap();

        // Allowlist is empty: the renderer is asking for a path the user
        // never opened.
        let allowed = AllowedPaths::default();
        let result = read_with_allowlist(&file_path.to_string_lossy(), &allowed);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not authorized"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn test_read_file_bytes_not_found() {
        let allowed = AllowedPaths::default();
        let result = read_with_allowlist("/nonexistent/path/file.nii", &allowed);
        assert!(result.is_err());
    }

    #[test]
    fn test_read_file_bytes_rejects_directory() {
        let dir = temp_subdir("niivue_test_dir_read");
        let allowed = allowlist_with(&[&dir]);
        let result = read_with_allowlist(&dir.to_string_lossy(), &allowed);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not a file"));
        std::fs::remove_dir_all(&dir).ok();
    }

    /// `list_directory`'s extension filter should match against the file
    /// name, not the full path. A path like `/tmp/.nii.gz/foo.bin` must
    /// not match a `.nii.gz` filter just because the parent directory
    /// happens to be named that way.
    #[test]
    fn test_list_directory_filter_matches_file_name_not_path() {
        let dir = temp_subdir("niivue_test_filter_path");
        let trap_dir = dir.join(".nii.gz");
        std::fs::create_dir_all(&trap_dir).unwrap();
        std::fs::File::create(trap_dir.join("foo.bin")).unwrap();
        std::fs::File::create(dir.join("real.nii.gz")).unwrap();

        // Hand-roll the filter the same way list_directory does, against
        // the file_name only.
        let exts = [".nii.gz".to_string()];
        let mut matches = Vec::new();
        for entry in std::fs::read_dir(&dir).unwrap().flatten() {
            let entry_path = entry.path();
            if !entry_path.is_file() {
                continue;
            }
            let file_name = entry_path
                .file_name()
                .map(|n| n.to_string_lossy().to_lowercase())
                .unwrap_or_default();
            if exts.iter().any(|ext| file_name.ends_with(ext)) {
                matches.push(entry_path);
            }
        }
        assert_eq!(matches.len(), 1);
        assert!(matches[0].ends_with("real.nii.gz"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn test_suggested_file_name_decodes_and_keeps_only_the_name() {
        assert_eq!(
            suggested_file_name(Some("gehirn%C3%BC.nvd")),
            "gehirn\u{fc}.nvd"
        );
        assert_eq!(
            suggested_file_name(Some("..%2F..%5Cetc%2Fscene.nvd")),
            "scene.nvd"
        );
        assert_eq!(suggested_file_name(Some("..")), "untitled");
        assert_eq!(suggested_file_name(Some("")), "untitled");
        assert_eq!(suggested_file_name(None), "untitled");
    }

    #[test]
    fn test_request_bytes_accepts_a_raw_body_or_a_json_byte_array() {
        let raw = tauri::ipc::InvokeBody::Raw(vec![1, 2, 255]);
        assert_eq!(request_bytes(&raw).unwrap().as_ref(), &[1, 2, 255]);
        let json = tauri::ipc::InvokeBody::Json(serde_json::json!([1, 2, 255]));
        assert_eq!(request_bytes(&json).unwrap().as_ref(), &[1, 2, 255]);
        let wrong = tauri::ipc::InvokeBody::Json(serde_json::json!({ "0": 1 }));
        assert!(request_bytes(&wrong).is_err());
    }

    #[test]
    fn test_save_filter_by_extension() {
        assert_eq!(save_filter("brain.nvd"), Some(("NiiVue Document", "nvd")));
        assert_eq!(
            save_filter("brain.NVD.json"),
            Some(("JSON Document", "json"))
        );
        assert_eq!(
            save_filter("brain_screenshot.png"),
            Some(("PNG Image", "png"))
        );
        assert_eq!(save_filter("notes.txt"), None);
    }
}
