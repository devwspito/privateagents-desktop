/**
 * Desktop Bridge — WebSocket client that connects the Tauri desktop app
 * to the backend, enabling the AI agent to execute tools on the user's
 * local computer (filesystem, shell, HTTP via local network, etc.).
 *
 * Only activates when running inside a Tauri environment.
 */

import {
  executeShell,
  getSystemInfo,
  isTauriEnv,
  listWorkspaceFiles,
  openInBrowser,
  readClipboardText,
  readWorkspaceFile,
  sendNotification,
  httpRequest as tauriHttpRequest,
  writeClipboardText,
  writeWorkspaceFile,
} from "./tauri"

type ConnectionState = "disconnected" | "connecting" | "connected"

type StateChangeCallback = (state: ConnectionState) => void

interface ExecuteMessage {
  type: "execute"
  id: string
  tool: string
  args: Record<string, unknown>
}

interface PingMessage {
  type: "ping"
}

interface NotificationMessage {
  type: "notification"
  title: string
  body: string
  action_url?: string
}

type ServerMessage = ExecuteMessage | PingMessage | NotificationMessage

export class DesktopBridge {
  private ws: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectDelay = 1000
  private maxReconnectDelay = 30000
  private wsUrl: string | null = null
  private token: string | null = null
  private _state: ConnectionState = "disconnected"
  private _destroyed = false
  private _authFailed = false
  private onStateChange: StateChangeCallback | null = null

  get state(): ConnectionState {
    return this._state
  }

  private setState(state: ConnectionState) {
    this._state = state
    this.onStateChange?.(state)
  }

  /**
   * Start the bridge. Only works in Tauri.
   * @param apiBaseUrl - e.g. "https://spark-f97c.tailc2d6d4.ts.net:8443/api"
   * @param token - JWT access token
   */
  connect(
    apiBaseUrl: string,
    token: string,
    onStateChange?: StateChangeCallback
  ) {
    if (!isTauriEnv()) return
    if (this._destroyed) return

    this.token = token
    this.onStateChange = onStateChange ?? null

    // Convert HTTP API URL to WebSocket URL for the bridge endpoint
    // e.g. "https://host:8443/api" → "wss://host:8443/ws/desktop-bridge"
    const base = apiBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "")
    const wsBase = base.replace(/^http/, "ws")
    this.wsUrl = `${wsBase}/ws/desktop-bridge?token=${encodeURIComponent(token)}`

    this.doConnect()
  }

  /** Update the token. Forces immediate reconnect if auth had failed. */
  updateToken(token: string) {
    const hadAuthFailure = this._authFailed
    this.token = token
    this._authFailed = false

    // If we were stuck in auth-failure reconnect loop, reconnect immediately
    if (hadAuthFailure && this.wsUrl && !this._destroyed) {
      console.log("[DesktopBridge] Token refreshed after auth failure, reconnecting now")
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
      // Update URL with fresh token and reconnect
      const base = this.wsUrl.split("?")[0]
      this.wsUrl = `${base}?token=${encodeURIComponent(token)}`
      this.reconnectDelay = 1000
      this.doConnect()
    }
  }

  disconnect() {
    this.cleanup()
    this.setState("disconnected")
  }

  destroy() {
    this._destroyed = true
    this.disconnect()
  }

  private doConnect() {
    if (this._destroyed || !this.wsUrl) return
    this.cleanup()
    this.setState("connecting")

    try {
      this.ws = new WebSocket(this.wsUrl)

      this.ws.onopen = () => {
        this.reconnectDelay = 1000
        this.setState("connected")
        this.startHeartbeat()
        console.log("[DesktopBridge] Connected")
      }

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as ServerMessage
          this.handleMessage(msg)
        } catch (e) {
          console.warn("[DesktopBridge] Invalid message:", e)
        }
      }

      this.ws.onclose = (event) => {
        this.setState("disconnected")
        // WS 4001 = explicit auth rejection from backend
        // 1006 = abnormal closure (could be auth 403 OR network error)
        // Only treat as auth failure if we never connected (no onopen fired)
        const wasNeverConnected = this._state !== "connected" && event.code === 1006
        if (event.code === 4001 || wasNeverConnected) {
          console.warn(`[DesktopBridge] Auth failed (code=${event.code}), requesting token refresh`)
          this._authFailed = true
          // Dispatch auth-failed and WAIT for refresh before reconnecting
          window.dispatchEvent(new CustomEvent("desktop-bridge-auth-failed"))
          // Delay reconnect to give refresh time to complete
          this.reconnectDelay = Math.max(this.reconnectDelay, 3000)
        }
        this.scheduleReconnect()
      }

      this.ws.onerror = (err) => {
        console.warn("[DesktopBridge] WebSocket error:", err)
        // onclose will fire after this
      }
    } catch (e) {
      console.error("[DesktopBridge] Connection failed:", e)
      this.scheduleReconnect()
    }
  }

  private cleanup() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onclose = null
      this.ws.onerror = null
      try {
        this.ws.close()
      } catch {
        /* ignore */
      }
      this.ws = null
    }
  }

  private scheduleReconnect() {
    if (this._destroyed || !this.wsUrl) return
    this.reconnectTimer = setTimeout(() => {
      // Refresh URL with latest token
      if (this.token && this.wsUrl) {
        const base = this.wsUrl.split("?")[0]
        this.wsUrl = `${base}?token=${encodeURIComponent(this.token)}`
      }
      this.doConnect()
    }, this.reconnectDelay)
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      this.maxReconnectDelay
    )
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }))
      }
    }, 30_000)
  }

  private async handleMessage(msg: ServerMessage) {
    if (msg.type === "ping") {
      this.ws?.send(JSON.stringify({ type: "pong" }))
      return
    }

    if (msg.type === "notification") {
      this.handleNotification(msg)
      return
    }

    if (msg.type === "execute") {
      const result = await this.executeTool(msg.tool, msg.args)
      this.ws?.send(
        JSON.stringify({
          type: "result",
          id: msg.id,
          ...result,
        })
      )
    }
  }

  private async handleNotification(msg: NotificationMessage) {
    if (document.hidden) {
      // Window is not visible — send native system notification
      await sendNotification(msg.title, msg.body)
    }
    // Dispatch custom event so the app can show a toast when visible
    window.dispatchEvent(
      new CustomEvent("desktop-notification", {
        detail: {
          title: msg.title,
          body: msg.body,
          action_url: msg.action_url,
        },
      })
    )
  }

  private async executeTool(
    tool: string,
    args: Record<string, unknown>
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      switch (tool) {
        case "http_request": {
          const res = await tauriHttpRequest({
            url: args["url"] as string,
            method: (args["method"] as string) ?? "GET",
            headers: (args["headers"] as Record<string, string>) ?? undefined,
            body: (args["body"] as string) ?? undefined,
            timeout_secs: (args["timeout_secs"] as number) ?? undefined,
          })
          if (!res) return { success: false, error: "Tauri not available" }
          return { success: true, data: res }
        }

        case "shell": {
          const res = await executeShell({
            script: args["script"] as string,
            cwd: (args["cwd"] as string) ?? undefined,
            timeout_secs: (args["timeout_secs"] as number) ?? undefined,
          })
          if (!res) return { success: false, error: "Tauri not available" }
          return {
            success: res.success,
            data: res,
            error: res.success ? undefined : res.stderr,
          }
        }

        case "read_file": {
          const res = await readWorkspaceFile(args["path"] as string)
          if (!res) return { success: false, error: "Tauri not available" }
          return { success: true, data: res }
        }

        case "write_file": {
          const res = await writeWorkspaceFile(
            args["path"] as string,
            args["content"] as string
          )
          if (!res) return { success: false, error: "Tauri not available" }
          return { success: true, data: res }
        }

        case "list_files": {
          const res = await listWorkspaceFiles(args["dir_path"] as string)
          if (!res) return { success: false, error: "Tauri not available" }
          return { success: true, data: res }
        }

        case "open_browser": {
          const ok = await openInBrowser(args["url"] as string)
          return { success: ok }
        }

        case "system_info": {
          const res = await getSystemInfo()
          if (!res) return { success: false, error: "Tauri not available" }
          return { success: true, data: res }
        }

        case "clipboard_read": {
          const text = await readClipboardText()
          return { success: true, data: { text } }
        }

        case "clipboard_write": {
          const ok = await writeClipboardText(args["text"] as string)
          return { success: ok }
        }

        case "save_deliverable": {
          const agentName = args["agent_name"] as string
          const taskLabel = args["task_label"] as string
          const files = args["files"] as Array<{
            relative_path: string
            content: string
          }>

          // Save to ~/Private Agents/{agent_name}/{task_label}/
          const sysInfo = await getSystemInfo()
          const homeDir = sysInfo?.home_dir || "~"
          const baseDir = `${homeDir}/Private Agents/${agentName}/${taskLabel}`

          let filesSaved = 0
          for (const file of files) {
            const filePath = `${baseDir}/${file.relative_path}`
            const res = await writeWorkspaceFile(filePath, file.content)
            if (res) filesSaved++
          }

          return {
            success: true,
            data: { path: baseDir, files_saved: filesSaved },
          }
        }

        default:
          return { success: false, error: `Unknown desktop tool: ${tool}` }
      }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  }
}

// Singleton
let _instance: DesktopBridge | null = null

export function getDesktopBridge(): DesktopBridge {
  if (!_instance) {
    _instance = new DesktopBridge()
  }
  return _instance
}
