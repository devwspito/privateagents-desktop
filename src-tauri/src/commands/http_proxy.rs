use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct HttpProxyRequest {
    pub url: String,
    pub method: Option<String>,
    pub headers: Option<HashMap<String, String>>,
    pub body: Option<String>,
    pub timeout_secs: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct HttpProxyResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub ok: bool,
}

/// Make an HTTP request from the native side (bypasses CORS).
///
/// This allows the agent to reach local network services,
/// internal APIs, or any endpoint the machine has network access to.
#[tauri::command]
pub async fn http_request(request: HttpProxyRequest) -> Result<HttpProxyResponse, String> {
    let client = reqwest::Client::new();
    let method = request
        .method
        .as_deref()
        .unwrap_or("GET")
        .to_uppercase();

    let timeout = std::time::Duration::from_secs(
        request.timeout_secs.unwrap_or(30).min(120),
    );

    let req_method = match method.as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        "PATCH" => reqwest::Method::PATCH,
        "HEAD" => reqwest::Method::HEAD,
        "OPTIONS" => reqwest::Method::OPTIONS,
        _ => return Err(format!("Unsupported HTTP method: {}", method)),
    };

    let mut builder = client.request(req_method, &request.url).timeout(timeout);

    if let Some(ref headers) = request.headers {
        for (k, v) in headers {
            builder = builder.header(k, v);
        }
    }

    if let Some(ref body) = request.body {
        builder = builder.body(body.clone());
    }

    let resp = builder
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    let status = resp.status().as_u16();
    let ok = resp.status().is_success();

    let headers: HashMap<String, String> = resp
        .headers()
        .iter()
        .map(|(k, v)| {
            (
                k.to_string(),
                v.to_str().unwrap_or("").to_string(),
            )
        })
        .collect();

    let body = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    Ok(HttpProxyResponse {
        status,
        headers,
        body,
        ok,
    })
}
