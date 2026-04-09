use crate::services::{
    AxumService, ConfigService, DatabaseService, DeepLinkDispatcherService, DonationAlertsService,
    ExchangeRatesService, MediaService, StreamElementsService, StreamLabsService, TelegramService,
    TtsService, TwitchService, WebSocketBroadcaster, WidySolService, WidyTonService,
};
use crate::utils::copy_assets_to_static;
use grammers_client::types::{LoginToken, PasswordToken};
use lingua::Language::{
    Arabic, Chinese, English, French, German, Hindi, Portuguese, Russian, Spanish, Ukrainian,
};
use lingua::LanguageDetectorBuilder;
use std::sync::Arc;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager, State};
use tokio::sync::Mutex;
pub struct ExecutionFlag(pub Mutex<bool>);

#[tauri::command]
pub async fn init(app: AppHandle, flag: State<'_, ExecutionFlag>) -> Result<(), String> {
    let mut executed = flag.0.lock().await;
    if *executed {
        return Ok(());
    }
    *executed = true;

    let version = app.package_info().version.to_string();

    //config
    let config_service = ConfigService::new(&app)?;
    app.manage(config_service.clone());

    //db
    let database_service = DatabaseService::new(&config_service.db_path, &version).await?;
    app.manage(database_service);

    //exchange
    let mut exchange_rates_service = ExchangeRatesService::new();
    exchange_rates_service.get_exchange_rates().await;
    app.manage(Mutex::new(exchange_rates_service));

    //http client
    let user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
    let reqwest_client = reqwest::Client::builder()
        .user_agent(user_agent)
        .build()
        .map_err(|e| format!("reqwest build error: {}", e))?;
    app.manage(reqwest_client);

    //ws
    let websocket_broadcaster = WebSocketBroadcaster::new();
    app.manage(websocket_broadcaster);

    //axum
    let axum_service = AxumService::new(
        &config_service.widget_path,
        &config_service.static_path,
        &config_service.auc_fighter_path,
    );
    axum_service.run(&app).await?;
    app.manage(axum_service);
    copy_assets_to_static(&config_service.assets_path, &config_service.static_path)?;

    //language detector
    let language_detector = LanguageDetectorBuilder::from_languages(&[
        English, French, German, Spanish, Russian, Ukrainian, Portuguese, Hindi, Chinese, Arabic,
    ])
    .build();
    app.manage(language_detector);

    //tts
    let tts_service = TtsService::new(&config_service.audio_path);
    app.manage(tts_service);

    //media
    let media_service = MediaService::new();
    app.manage(media_service);

    //twitch
    let twitch_service = TwitchService::new(config_service.client_id);
    let _ = twitch_service.connect(&app).await;
    app.manage(twitch_service);

    //stream elements
    let stream_elements_service = StreamElementsService::new();
    app.manage(stream_elements_service);

    //telegram
    app.manage(Mutex::new(None::<LoginToken>));
    app.manage(Mutex::new(None::<PasswordToken>));
    let session_path = app
        .path()
        .resolve("telegram.session", BaseDirectory::AppLocalData)
        .map_err(|e| log::error!("Failed to resolve telegram session path: {}", e));
    if let Ok(session_path) = session_path {
        let mut telegram_service =
            TelegramService::new(config_service.api_id, config_service.api_hash, session_path);
        let _ = telegram_service.connect(&app).await;
        app.manage(telegram_service);
    }

    //widy sol
    let widy_sol_service = Arc::new(WidySolService::new(&config_service.widy_sol_program_id));
    let _ = widy_sol_service.connect(&app).await;
    app.manage(widy_sol_service.clone());

    //widy sol
    let widy_ton_service = Arc::new(WidyTonService::new());
    let _ = widy_ton_service.connect(&app).await;
    app.manage(widy_ton_service.clone());

    //donation alerts
    let donation_alerts_service = DonationAlertsService::new();
    let _ = donation_alerts_service.connect(&app).await;
    app.manage(donation_alerts_service);

    //stream labs
    let stream_labs_service = StreamLabsService::new();
    let _ = stream_labs_service.connect(&app).await;
    app.manage(stream_labs_service);

    //deep link
    let mut deep_link_dispatcher_service = DeepLinkDispatcherService::new();
    deep_link_dispatcher_service.register(widy_sol_service);
    deep_link_dispatcher_service.register(widy_ton_service);
    app.manage(deep_link_dispatcher_service);

    Ok(())
}
