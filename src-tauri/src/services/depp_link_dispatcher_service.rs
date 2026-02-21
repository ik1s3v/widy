use std::sync::Arc;
use tauri::AppHandle;
use url::Url;

pub trait DeepLinkHandler: Send + Sync {
    fn can_handle(&self, url: &Url) -> bool;
    fn handle(&self, url: &Url, app: &AppHandle);
}
pub struct DeepLinkDispatcherService {
    handlers: Vec<Arc<dyn DeepLinkHandler>>,
}

impl DeepLinkDispatcherService {
    pub fn new() -> Self {
        Self { handlers: vec![] }
    }

    pub fn register(&mut self, handler: Arc<dyn DeepLinkHandler>) {
        self.handlers.push(handler);
    }

    pub fn dispatch(&self, url: &Url, app: &AppHandle) {
        for handler in &self.handlers {
            if handler.can_handle(url) {
                handler.handle(url, app);
                return;
            }
        }
        log::warn!("No handler for deep link: {url}");
    }
}
