use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "settings")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: u8,
    pub moderation_duration: u32,
    pub alert_paused: bool,
    pub tts_volume: u32,
    pub remove_links: bool,
    pub black_list: String,
    pub language: String,
    pub currency: Currency,
    pub tts_type: TtsType,
    pub tts_settings: Option<TtsSettings>,
    pub widget_token: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

#[derive(Debug, Clone, PartialEq, EnumIter, Eq, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Text")]
pub enum Currency {
    #[sea_orm(string_value = "UAH")]
    UAH,
    #[sea_orm(string_value = "RUB")]
    RUB,
    #[sea_orm(string_value = "EUR")]
    EUR,
    #[sea_orm(string_value = "USD")]
    USD,
    #[sea_orm(string_value = "BRL")]
    BRL,
    #[sea_orm(string_value = "TRY")]
    TRY,
    #[sea_orm(string_value = "BYN")]
    BYN,
    #[sea_orm(string_value = "KZT")]
    KZT,
    #[sea_orm(string_value = "AUD")]
    AUD,
    #[sea_orm(string_value = "CAD")]
    CAD,
    #[sea_orm(string_value = "CZK")]
    CZK,
    #[sea_orm(string_value = "DKK")]
    DKK,
    #[sea_orm(string_value = "HKD")]
    HKD,
    #[sea_orm(string_value = "ILS")]
    ILS,
    #[sea_orm(string_value = "MYR")]
    MYR,
    #[sea_orm(string_value = "MXN")]
    MXN,
    #[sea_orm(string_value = "NOK")]
    NOK,
    #[sea_orm(string_value = "NZD")]
    NZD,
    #[sea_orm(string_value = "PHP")]
    PHP,
    #[sea_orm(string_value = "PLN")]
    PLN,
    #[sea_orm(string_value = "GBP")]
    GBP,
    #[sea_orm(string_value = "SGD")]
    SGD,
    #[sea_orm(string_value = "SEK")]
    SEK,
    #[sea_orm(string_value = "CHF")]
    CHF,
    #[sea_orm(string_value = "THB")]
    THB,
    #[sea_orm(string_value = "NONE")]
    NONE,
}

impl Currency {
    pub fn as_str(&self) -> &str {
        match self {
            Currency::UAH => "UAH",
            Currency::RUB => "RUB",
            Currency::EUR => "EUR",
            Currency::USD => "USD",
            Currency::BRL => "BRL",
            Currency::TRY => "TRY",
            Currency::BYN => "BYN",
            Currency::KZT => "KZT",
            Currency::AUD => "AUD",
            Currency::CAD => "CAD",
            Currency::CZK => "CZK",
            Currency::DKK => "DKK",
            Currency::HKD => "HKD",
            Currency::ILS => "ILS",
            Currency::MYR => "MYR",
            Currency::MXN => "MXN",
            Currency::NOK => "NOK",
            Currency::NZD => "NZD",
            Currency::PHP => "PHP",
            Currency::PLN => "PLN",
            Currency::GBP => "GBP",
            Currency::SGD => "SGD",
            Currency::SEK => "SEK",
            Currency::CHF => "CHF",
            Currency::THB => "THB",
            Currency::NONE => "NONE",
        }
    }
}

#[derive(Debug, Clone, PartialEq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Text")]
pub enum TtsType {
    #[sea_orm(string_value = "Google")]
    Google,
    #[sea_orm(string_value = "Edge")]
    Edge,
}
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, FromJsonQueryResult)]
#[serde(untagged)]

pub enum TtsSettings {
    Edge(EdgeTtsSettings),
}
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EdgeTtsSettings {
    pub gender: Gender,
}
#[derive(Debug, Clone, PartialEq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Text")]
pub enum Gender {
    #[sea_orm(string_value = "Male")]
    Male,
    #[sea_orm(string_value = "Female")]
    Female,
}
