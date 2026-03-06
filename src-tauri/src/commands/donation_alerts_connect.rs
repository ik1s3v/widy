use crate::services::DonationAlertsService;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn donation_alerts_connect(
    app: AppHandle,
    donation_alerts_service: State<'_, DonationAlertsService>,
) -> Result<(), String> {
    donation_alerts_service.connect(&app).await
}
