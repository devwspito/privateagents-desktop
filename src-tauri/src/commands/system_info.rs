use serde::Serialize;
use std::collections::HashMap;
use std::env;

#[derive(Debug, Serialize)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub hostname: String,
    pub username: String,
    pub home_dir: Option<String>,
    pub current_dir: Option<String>,
    pub temp_dir: String,
    pub platform: String,
}

#[derive(Debug, Serialize)]
pub struct EnvVarsResult {
    pub variables: HashMap<String, String>,
}

/// Get system information: OS, architecture, hostname, username, paths.
#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, String> {
    let hostname = hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_else(|_| "unknown".to_string());

    let username = env::var("USER")
        .or_else(|_| env::var("USERNAME"))
        .unwrap_or_else(|_| "unknown".to_string());

    let platform = if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "unknown"
    };

    Ok(SystemInfo {
        os: env::consts::OS.to_string(),
        arch: env::consts::ARCH.to_string(),
        hostname,
        username,
        home_dir: dirs::home_dir().map(|p| p.to_string_lossy().to_string()),
        current_dir: env::current_dir()
            .ok()
            .map(|p| p.to_string_lossy().to_string()),
        temp_dir: env::temp_dir().to_string_lossy().to_string(),
        platform: platform.to_string(),
    })
}

/// Get environment variables. Optionally filter by prefix.
#[tauri::command]
pub async fn get_env_vars(prefix: Option<String>) -> Result<EnvVarsResult, String> {
    let variables: HashMap<String, String> = env::vars()
        .filter(|(k, _)| {
            if let Some(ref p) = prefix {
                k.starts_with(p)
            } else {
                true
            }
        })
        .collect();

    Ok(EnvVarsResult { variables })
}

/// Get a single environment variable.
#[tauri::command]
pub async fn get_env_var(name: String) -> Result<Option<String>, String> {
    Ok(env::var(&name).ok())
}

/// Get the PATH entries as a list.
#[tauri::command]
pub async fn get_path_entries() -> Result<Vec<String>, String> {
    let path = env::var("PATH").unwrap_or_default();
    let separator = if cfg!(target_os = "windows") {
        ';'
    } else {
        ':'
    };
    Ok(path.split(separator).map(String::from).collect())
}
