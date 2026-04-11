use serde::Serialize;
use std::path::PathBuf;

/// Metadata about a loaded file
#[derive(Serialize)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
}

/// Read a file from disk and return its raw bytes.
/// This is the core command for loading NIfTI/DICOM files without CORS restrictions.
#[tauri::command]
pub fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    let file_path = PathBuf::from(&path);
    if !file_path.exists() {
        return Err(format!("File not found: {path}"));
    }
    if !file_path.is_file() {
        return Err(format!("Path is not a file: {path}"));
    }
    std::fs::read(&file_path).map_err(|e| format!("Failed to read file: {e}"))
}

/// Return metadata about a file without reading its contents.
#[tauri::command]
pub fn get_file_info(path: String) -> Result<FileInfo, String> {
    let file_path = PathBuf::from(&path);
    if !file_path.exists() {
        return Err(format!("File not found: {path}"));
    }
    let metadata = std::fs::metadata(&file_path).map_err(|e| format!("Failed to read metadata: {e}"))?;
    let name = file_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    Ok(FileInfo {
        path,
        name,
        size: metadata.len(),
    })
}

/// List files in a directory, optionally filtered by extensions.
#[tauri::command]
pub fn list_directory(path: String, extensions: Option<Vec<String>>) -> Result<Vec<FileInfo>, String> {
    let dir_path = PathBuf::from(&path);
    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {path}"));
    }
    let entries = std::fs::read_dir(&dir_path).map_err(|e| format!("Failed to read directory: {e}"))?;
    let mut files = Vec::new();
    for entry in entries.flatten() {
        let entry_path = entry.path();
        if !entry_path.is_file() {
            continue;
        }
        if let Some(ref exts) = extensions {
            let file_name = entry_path.to_string_lossy().to_lowercase();
            if !exts.iter().any(|ext| file_name.ends_with(&ext.to_lowercase())) {
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
    Ok(files)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            read_file_bytes,
            get_file_info,
            list_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_read_file_bytes_success() {
        let dir = std::env::temp_dir().join("niivue_test_read");
        std::fs::create_dir_all(&dir).unwrap();
        let file_path = dir.join("test.nii");
        let mut f = std::fs::File::create(&file_path).unwrap();
        f.write_all(b"fake nifti data").unwrap();
        let result = read_file_bytes(file_path.to_string_lossy().to_string());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), b"fake nifti data");
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn test_read_file_bytes_not_found() {
        let result = read_file_bytes("/nonexistent/path/file.nii".to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("File not found"));
    }

    #[test]
    fn test_read_file_bytes_is_directory() {
        let dir = std::env::temp_dir().join("niivue_test_dir");
        std::fs::create_dir_all(&dir).unwrap();
        let result = read_file_bytes(dir.to_string_lossy().to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not a file"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn test_get_file_info_success() {
        let dir = std::env::temp_dir().join("niivue_test_info");
        std::fs::create_dir_all(&dir).unwrap();
        let file_path = dir.join("brain.nii.gz");
        let mut f = std::fs::File::create(&file_path).unwrap();
        f.write_all(b"compressed data here").unwrap();
        let result = get_file_info(file_path.to_string_lossy().to_string());
        assert!(result.is_ok());
        let info = result.unwrap();
        assert_eq!(info.name, "brain.nii.gz");
        assert_eq!(info.size, 20);
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn test_get_file_info_not_found() {
        let result = get_file_info("/nonexistent/file.nii".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn test_list_directory_success() {
        let dir = std::env::temp_dir().join("niivue_test_list");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::File::create(dir.join("a.nii")).unwrap();
        std::fs::File::create(dir.join("b.nii.gz")).unwrap();
        std::fs::File::create(dir.join("c.txt")).unwrap();
        let result = list_directory(dir.to_string_lossy().to_string(), None);
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 3);
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn test_list_directory_with_filter() {
        let dir = std::env::temp_dir().join("niivue_test_filter");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::File::create(dir.join("a.nii")).unwrap();
        std::fs::File::create(dir.join("b.nii.gz")).unwrap();
        std::fs::File::create(dir.join("c.txt")).unwrap();
        let result = list_directory(
            dir.to_string_lossy().to_string(),
            Some(vec![".nii".to_string(), ".nii.gz".to_string()]),
        );
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 2);
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn test_list_directory_not_a_dir() {
        let result = list_directory("/nonexistent/dir".to_string(), None);
        assert!(result.is_err());
    }
}
