use serde::Serialize;
use std::path::PathBuf;
use tokio::fs;

#[derive(Debug, Serialize)]
pub struct FileContent {
    pub path: String,
    pub content: String,
    pub size: u64,
}

#[derive(Debug, Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct WriteResult {
    pub path: String,
    pub bytes_written: usize,
}

#[tauri::command]
pub async fn read_workspace_file(path: String) -> Result<FileContent, String> {
    let file_path = PathBuf::from(&path);

    if !file_path.exists() {
        return Err(format!("File not found: {}", path));
    }

    let metadata = fs::metadata(&file_path)
        .await
        .map_err(|e| format!("Cannot read file metadata: {}", e))?;

    let content = fs::read_to_string(&file_path)
        .await
        .map_err(|e| format!("Cannot read file: {}", e))?;

    Ok(FileContent {
        path,
        content,
        size: metadata.len(),
    })
}

#[tauri::command]
pub async fn write_workspace_file(path: String, content: String) -> Result<WriteResult, String> {
    let file_path = PathBuf::from(&path);

    // Create parent directories if they don't exist
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Cannot create directories: {}", e))?;
    }

    let bytes = content.as_bytes().len();
    fs::write(&file_path, &content)
        .await
        .map_err(|e| format!("Cannot write file: {}", e))?;

    Ok(WriteResult {
        path,
        bytes_written: bytes,
    })
}

#[tauri::command]
pub async fn save_to_downloads(file_name: String, data: Vec<u8>) -> Result<WriteResult, String> {
    let downloads_dir = dirs::download_dir()
        .ok_or_else(|| "Cannot determine Downloads directory".to_string())?;

    let file_path = downloads_dir.join(&file_name);

    // Avoid overwriting: append (1), (2), etc. if file exists
    let final_path = if file_path.exists() {
        let stem = file_path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        let ext = file_path
            .extension()
            .map(|s| format!(".{}", s.to_string_lossy()))
            .unwrap_or_default();
        let mut i = 1u32;
        loop {
            let candidate = downloads_dir.join(format!("{} ({}){}", stem, i, ext));
            if !candidate.exists() {
                break candidate;
            }
            i += 1;
        }
    } else {
        file_path
    };

    let bytes_written = data.len();
    fs::write(&final_path, &data)
        .await
        .map_err(|e| format!("Cannot write file: {}", e))?;

    Ok(WriteResult {
        path: final_path.to_string_lossy().to_string(),
        bytes_written,
    })
}

#[tauri::command]
pub async fn list_workspace_files(dir_path: String) -> Result<Vec<FileEntry>, String> {
    let dir = PathBuf::from(&dir_path);

    if !dir.exists() {
        return Err(format!("Directory not found: {}", dir_path));
    }

    if !dir.is_dir() {
        return Err(format!("Path is not a directory: {}", dir_path));
    }

    let mut entries = Vec::new();
    let mut read_dir = fs::read_dir(&dir)
        .await
        .map_err(|e| format!("Cannot read directory: {}", e))?;

    while let Some(entry) = read_dir
        .next_entry()
        .await
        .map_err(|e| format!("Error reading entry: {}", e))?
    {
        let metadata = entry
            .metadata()
            .await
            .map_err(|e| format!("Cannot read metadata: {}", e))?;

        let modified = metadata
            .modified()
            .ok()
            .and_then(|t| {
                t.duration_since(std::time::UNIX_EPOCH)
                    .ok()
                    .map(|d| d.as_secs().to_string())
            });

        entries.push(FileEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
            size: metadata.len(),
            modified,
        });
    }

    // Sort: directories first, then alphabetically
    entries.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(entries)
}
