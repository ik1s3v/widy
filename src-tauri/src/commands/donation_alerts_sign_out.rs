use tauri::{AppHandle, State};

use crate::services::DonationAlertsService;

#[tauri::command]
pub async fn donation_alerts_sign_out(
    app: AppHandle,
    donation_alerts_service: State<'_, DonationAlertsService>,
) -> Result<(), String> {
    donation_alerts_service.sign_out(&app).await
}
