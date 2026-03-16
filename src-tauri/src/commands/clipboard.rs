use tauri_plugin_clipboard_manager::ClipboardExt;

#[tauri::command]
pub fn read_clipboard_text(app: tauri::AppHandle) -> Result<String, String> {
    app.clipboard()
        .read_text()
        .map_err(|e| format!("Failed to read clipboard: {}", e))
}

#[tauri::command]
pub fn write_clipboard_text(app: tauri::AppHandle, text: String) -> Result<(), String> {
    app.clipboard()
        .write_text(&text)
        .map_err(|e| format!("Failed to write to clipboard: {}", e))
}

#[tauri::command]
pub fn write_clipboard_html(app: tauri::AppHandle, html: String) -> Result<(), String> {
    app.clipboard()
        .write_html(&html, None::<&String>)
        .map_err(|e| format!("Failed to write HTML to clipboard: {}", e))
}
