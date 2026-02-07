// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use dotenvy;

#[tokio::main]
async fn main() {
    #[cfg(debug_assertions)]
    dotenvy::from_filename(".env.development").ok();
    widy_lib::run()
}
