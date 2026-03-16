// ─── Tauri environment detection ─────────────────────────────────────────────

function isTauriEnv(): boolean {
  return (
    typeof window !== "undefined" &&
    (!!window.__TAURI_INTERNALS__ || !!window.__TAURI__)
  )
}

async function invokeCommand<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (!isTauriEnv()) {
    throw new Error("Not running in Tauri environment")
  }
  const { invoke } = await import("@tauri-apps/api/core")
  return invoke<T>(cmd, args)
}

// ─── Ollama types ────────────────────────────────────────────────────────────

export interface OllamaStatus {
  running: boolean
  version: string | null
  error: string | null
}

export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
}

export interface OllamaModelsResult {
  models: OllamaModel[]
}

export interface OllamaModelInfo {
  modelfile: string | null
  parameters: string | null
  template: string | null
}

// ─── Filesystem types ────────────────────────────────────────────────────────

export interface FileContent {
  path: string
  content: string
  size: number
}

export interface FileEntry {
  name: string
  path: string
  is_dir: boolean
  size: number
  modified: string | null
}

export interface WriteResult {
  path: string
  bytes_written: number
}

// ─── Ollama commands ─────────────────────────────────────────────────────────

export async function checkOllamaStatus(): Promise<OllamaStatus | null> {
  if (!isTauriEnv()) return null
  return invokeCommand<OllamaStatus>("check_ollama_status")
}

export async function listOllamaModels(): Promise<OllamaModelsResult | null> {
  if (!isTauriEnv()) return null
  return invokeCommand<OllamaModelsResult>("list_ollama_models")
}

export async function getOllamaModelInfo(
  name: string
): Promise<OllamaModelInfo | null> {
  if (!isTauriEnv()) return null
  return invokeCommand<OllamaModelInfo>("get_ollama_model_info", { name })
}

// ─── Filesystem commands ─────────────────────────────────────────────────────

export async function readWorkspaceFile(
  path: string
): Promise<FileContent | null> {
  if (!isTauriEnv()) return null
  return invokeCommand<FileContent>("read_workspace_file", { path })
}

export async function writeWorkspaceFile(
  path: string,
  content: string
): Promise<WriteResult | null> {
  if (!isTauriEnv()) return null
  return invokeCommand<WriteResult>("write_workspace_file", { path, content })
}

export async function listWorkspaceFiles(
  dirPath: string
): Promise<FileEntry[] | null> {
  if (!isTauriEnv()) return null
  return invokeCommand<FileEntry[]>("list_workspace_files", {
    dir_path: dirPath,
  })
}

/**
 * Save binary data to the user's Downloads folder.
 * Returns the final path (handles name collisions automatically).
 */
export async function saveToDownloads(
  fileName: string,
  data: Uint8Array
): Promise<WriteResult | null> {
  if (!isTauriEnv()) return null
  return invokeCommand<WriteResult>("save_to_downloads", {
    fileName,
    data: Array.from(data),
  })
}

// ─── Notification commands ───────────────────────────────────────────────────

export async function sendNotification(
  title: string,
  body: string
): Promise<boolean> {
  if (!isTauriEnv()) return false
  await invokeCommand<void>("send_notification", { title, body })
  return true
}

// ─── Clipboard commands ──────────────────────────────────────────────────────

export async function readClipboardText(): Promise<string | null> {
  if (!isTauriEnv()) return null
  return invokeCommand<string>("read_clipboard_text")
}

export async function writeClipboardText(text: string): Promise<boolean> {
  if (!isTauriEnv()) return false
  await invokeCommand<void>("write_clipboard_text", { text })
  return true
}

export async function writeClipboardHtml(html: string): Promise<boolean> {
  if (!isTauriEnv()) return false
  await invokeCommand<void>("write_clipboard_html", { html })
  return true
}

// ─── Shell / Process types ────────────────────────────────────────────────────

export interface CommandOutput {
  stdout: string
  stderr: string
  exit_code: number | null
  success: boolean
}

export interface ExecuteCommandOptions {
  command: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  timeout_secs?: number
}

export interface ExecuteShellOptions {
  script: string
  cwd?: string
  env?: Record<string, string>
  timeout_secs?: number
}

// ─── Shell / Process commands ─────────────────────────────────────────────────

/** Execute a command directly (e.g. "python3", "ls", "powershell"). */
export async function executeCommand(
  options: ExecuteCommandOptions
): Promise<CommandOutput | null> {
  if (!isTauriEnv()) return null
  return invokeCommand<CommandOutput>("execute_command", {
    command: options.command,
    args: options.args ?? null,
    cwd: options.cwd ?? null,
    env: options.env ?? null,
    timeout_secs: options.timeout_secs ?? null,
  })
}

/** Execute through the system shell (sh -c / cmd /C). Supports pipes, redirects. */
export async function executeShell(
  options: ExecuteShellOptions
): Promise<CommandOutput | null> {
  if (!isTauriEnv()) return null
  return invokeCommand<CommandOutput>("execute_shell", {
    script: options.script,
    cwd: options.cwd ?? null,
    env: options.env ?? null,
    timeout_secs: options.timeout_secs ?? null,
  })
}

/** Open a URL in the system's default browser. */
export async function openInBrowser(url: string): Promise<boolean> {
  if (!isTauriEnv()) return false
  await invokeCommand<void>("open_in_browser", { url })
  return true
}

/** Open a file or folder with the system's default application. */
export async function openWithDefaultApp(path: string): Promise<boolean> {
  if (!isTauriEnv()) return false
  await invokeCommand<void>("open_with_default_app", { path })
  return true
}

// ─── System info types ──────────────────────────────────────────────────────

export interface SystemInfo {
  os: string
  arch: string
  hostname: string
  username: string
  home_dir: string | null
  current_dir: string | null
  temp_dir: string
  platform: string
}

export interface EnvVarsResult {
  variables: Record<string, string>
}

// ─── System info commands ───────────────────────────────────────────────────

/** Get system information: OS, architecture, hostname, username, paths. */
export async function getSystemInfo(): Promise<SystemInfo | null> {
  if (!isTauriEnv()) return null
  return invokeCommand<SystemInfo>("get_system_info")
}

/** Get environment variables. Optionally filter by prefix. */
export async function getEnvVars(
  prefix?: string
): Promise<EnvVarsResult | null> {
  if (!isTauriEnv()) return null
  return invokeCommand<EnvVarsResult>("get_env_vars", {
    prefix: prefix ?? null,
  })
}

/** Get a single environment variable. */
export async function getEnvVar(name: string): Promise<string | null> {
  if (!isTauriEnv()) return null
  const result = await invokeCommand<string | null>("get_env_var", { name })
  return result
}

/** Get the PATH entries as a list. */
export async function getPathEntries(): Promise<string[] | null> {
  if (!isTauriEnv()) return null
  return invokeCommand<string[]>("get_path_entries")
}

// ─── HTTP proxy types ───────────────────────────────────────────────────────

export interface HttpProxyRequest {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: string
  timeout_secs?: number
}

export interface HttpProxyResponse {
  status: number
  headers: Record<string, string>
  body: string
  ok: boolean
}

// ─── HTTP proxy command ─────────────────────────────────────────────────────

/**
 * Make an HTTP request from the native side (bypasses CORS).
 * Allows reaching local network services, internal APIs, etc.
 */
export async function httpRequest(
  request: HttpProxyRequest
): Promise<HttpProxyResponse | null> {
  if (!isTauriEnv()) return null
  return invokeCommand<HttpProxyResponse>("http_request", { request })
}

// ─── Re-export environment detection ────────────────────────────────────────

export { isTauriEnv }
