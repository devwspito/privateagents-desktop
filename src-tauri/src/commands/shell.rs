use serde::Serialize;
use std::collections::HashMap;
use tokio::process::Command;

#[derive(Debug, Serialize)]
pub struct CommandOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
    pub success: bool,
}

#[derive(Debug, Serialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub started: bool,
}

/// Execute a shell command and return stdout/stderr/exit_code.
///
/// - `command`: the program to run (e.g. "ls", "python3", "powershell")
/// - `args`: list of arguments
/// - `cwd`: optional working directory
/// - `env`: optional extra environment variables
/// - `timeout_secs`: optional timeout (default 30s, max 300s)
#[tauri::command]
pub async fn execute_command(
    command: String,
    args: Option<Vec<String>>,
    cwd: Option<String>,
    env: Option<HashMap<String, String>>,
    timeout_secs: Option<u64>,
) -> Result<CommandOutput, String> {
    let timeout = std::time::Duration::from_secs(
        timeout_secs.unwrap_or(30).min(300),
    );

    let mut cmd = Command::new(&command);

    if let Some(ref a) = args {
        cmd.args(a);
    }
    if let Some(ref dir) = cwd {
        cmd.current_dir(dir);
    }
    if let Some(ref envs) = env {
        for (k, v) in envs {
            cmd.env(k, v);
        }
    }

    let result = tokio::time::timeout(timeout, cmd.output()).await;

    match result {
        Ok(Ok(output)) => Ok(CommandOutput {
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            exit_code: output.status.code(),
            success: output.status.success(),
        }),
        Ok(Err(e)) => Err(format!("Failed to execute command '{}': {}", command, e)),
        Err(_) => Err(format!(
            "Command '{}' timed out after {}s",
            command,
            timeout.as_secs()
        )),
    }
}

/// Execute a command through the system shell (sh -c on Unix, cmd /C on Windows).
/// Allows pipes, redirects, and chained commands.
#[tauri::command]
pub async fn execute_shell(
    script: String,
    cwd: Option<String>,
    env: Option<HashMap<String, String>>,
    timeout_secs: Option<u64>,
) -> Result<CommandOutput, String> {
    let timeout = std::time::Duration::from_secs(
        timeout_secs.unwrap_or(30).min(300),
    );

    let mut cmd = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/C", &script]);
        c
    } else {
        let mut c = Command::new("sh");
        c.args(["-c", &script]);
        c
    };

    if let Some(ref dir) = cwd {
        cmd.current_dir(dir);
    }
    if let Some(ref envs) = env {
        for (k, v) in envs {
            cmd.env(k, v);
        }
    }

    let result = tokio::time::timeout(timeout, cmd.output()).await;

    match result {
        Ok(Ok(output)) => Ok(CommandOutput {
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            exit_code: output.status.code(),
            success: output.status.success(),
        }),
        Ok(Err(e)) => Err(format!("Shell execution failed: {}", e)),
        Err(_) => Err(format!(
            "Shell command timed out after {}s",
            timeout.as_secs()
        )),
    }
}

/// Open a URL in the system's default browser.
#[tauri::command]
pub async fn open_in_browser(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| format!("Failed to open URL: {}", e))
}

/// Open a file or folder with the system's default application.
#[tauri::command]
pub async fn open_with_default_app(path: String) -> Result<(), String> {
    open::that(&path).map_err(|e| format!("Failed to open path: {}", e))
}
