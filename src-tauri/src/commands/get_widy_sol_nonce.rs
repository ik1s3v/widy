use crate::services::WidySolService;
use tauri::State;

#[tauri::command]
pub async fn get_widy_sol_nonce(
    widy_sol_service: State<'_, WidySolService>,
) -> Result<Option<String>, String> {
    let mut nonce = widy_sol_service.nonce.lock().unwrap();
    *nonce = Some(uuid::Uuid::new_v4().to_string());
    Ok(nonce.clone())
}
