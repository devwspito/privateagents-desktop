use serde::{Deserialize, Serialize};

const OLLAMA_BASE_URL: &str = "http://localhost:11434";

#[derive(Debug, Serialize)]
pub struct OllamaStatus {
    pub running: bool,
    pub version: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OllamaVersionResponse {
    version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaModel {
    pub name: String,
    pub size: u64,
    pub digest: String,
    pub modified_at: String,
}

#[derive(Debug, Deserialize)]
struct OllamaTagsResponse {
    models: Vec<OllamaModel>,
}

#[derive(Debug, Serialize)]
pub struct OllamaModelsResult {
    pub models: Vec<OllamaModel>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaModelInfo {
    pub modelfile: Option<String>,
    pub parameters: Option<String>,
    pub template: Option<String>,
}

#[tauri::command]
pub async fn check_ollama_status() -> Result<OllamaStatus, String> {
    let client = reqwest::Client::new();
    match client
        .get(format!("{}/api/version", OLLAMA_BASE_URL))
        .timeout(std::time::Duration::from_secs(3))
        .send()
        .await
    {
        Ok(resp) => match resp.json::<OllamaVersionResponse>().await {
            Ok(data) => Ok(OllamaStatus {
                running: true,
                version: Some(data.version),
                error: None,
            }),
            Err(e) => Ok(OllamaStatus {
                running: true,
                version: None,
                error: Some(format!("Failed to parse response: {}", e)),
            }),
        },
        Err(e) => Ok(OllamaStatus {
            running: false,
            version: None,
            error: Some(format!("Cannot connect to Ollama: {}", e)),
        }),
    }
}

#[tauri::command]
pub async fn list_ollama_models() -> Result<OllamaModelsResult, String> {
    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/api/tags", OLLAMA_BASE_URL))
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("Cannot connect to Ollama: {}", e))?;

    let data: OllamaTagsResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse models: {}", e))?;

    Ok(OllamaModelsResult {
        models: data.models,
    })
}

#[tauri::command]
pub async fn get_ollama_model_info(name: String) -> Result<OllamaModelInfo, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/api/show", OLLAMA_BASE_URL))
        .json(&serde_json::json!({ "name": name }))
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("Cannot connect to Ollama: {}", e))?;

    let info: OllamaModelInfo = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse model info: {}", e))?;

    Ok(info)
}
