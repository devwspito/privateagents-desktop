mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            // Ollama
            commands::ollama::check_ollama_status,
            commands::ollama::list_ollama_models,
            commands::ollama::get_ollama_model_info,
            // Filesystem
            commands::filesystem::read_workspace_file,
            commands::filesystem::write_workspace_file,
            commands::filesystem::list_workspace_files,
            commands::filesystem::save_to_downloads,
            // Notifications
            commands::notifications::send_notification,
            // Clipboard
            commands::clipboard::read_clipboard_text,
            commands::clipboard::write_clipboard_text,
            commands::clipboard::write_clipboard_html,
            // Shell / Process execution
            commands::shell::execute_command,
            commands::shell::execute_shell,
            commands::shell::open_in_browser,
            commands::shell::open_with_default_app,
            // System info
            commands::system_info::get_system_info,
            commands::system_info::get_env_vars,
            commands::system_info::get_env_var,
            commands::system_info::get_path_entries,
            // HTTP proxy (native, bypasses CORS)
            commands::http_proxy::http_request,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Private Agents desktop app");
}
