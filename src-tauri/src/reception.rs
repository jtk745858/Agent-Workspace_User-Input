use std::sync::LazyLock;

use regex::Regex;
use serde::{Deserialize, Serialize};
use unicode_properties::{GeneralCategoryGroup, UnicodeGeneralCategory};
use unicode_segmentation::UnicodeSegmentation;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Request {
    request_id: String,
    raw_text: String,
}

#[derive(Serialize)]
#[serde(
    tag = "status",
    rename_all = "lowercase",
    rename_all_fields = "camelCase"
)]
pub(crate) enum Response {
    Received {
        request_id: String,
        received_text: String,
    },
    Rejected {
        request_id: String,
        error_code: Rejection,
        message: &'static str,
    },
}

#[derive(Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub(crate) enum Rejection {
    InvalidRequestId,
    InputTooLong,
    InvalidInput,
}

impl Rejection {
    fn message(&self) -> &'static str {
        match self {
            Self::InvalidRequestId => "Invalid request ID",
            Self::InputTooLong => "Input exceeds 8192 UTF-8 bytes",
            Self::InvalidInput => "Invalid input",
        }
    }
}

const MAX_BYTES: usize = 8192;
static UUID_V4: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"\A[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\z").unwrap()
});

// In Emoji 17.0, only numeric keycaps and the information symbol contain L/N.
// Match the same qualified and unqualified forms as the FE within each grapheme.
fn has_content(text: &str) -> bool {
    text.graphemes(true).any(|cluster| {
        cluster.char_indices().any(|(index, ch)| {
            if ch == '\u{2139}' {
                return false;
            }
            if ch.is_ascii_digit() {
                let rest = &cluster[index + 1..];
                return !rest
                    .strip_prefix('\u{fe0f}')
                    .unwrap_or(rest)
                    .starts_with('\u{20e3}');
            }
            matches!(
                ch.general_category_group(),
                GeneralCategoryGroup::Letter | GeneralCategoryGroup::Number
            )
        })
    })
}

fn validate(request: &Request) -> Result<(), Rejection> {
    if !UUID_V4.is_match(&request.request_id) {
        return Err(Rejection::InvalidRequestId);
    }
    if request.raw_text.len() > MAX_BYTES {
        return Err(Rejection::InputTooLong);
    }
    if !has_content(&request.raw_text) {
        return Err(Rejection::InvalidInput);
    }
    Ok(())
}

#[tauri::command]
pub(crate) fn receive_user_input(request: Request) -> Response {
    match validate(&request) {
        Ok(()) => Response::Received {
            request_id: request.request_id,
            received_text: request.raw_text,
        },
        Err(error_code) => Response::Rejected {
            request_id: request.request_id,
            message: error_code.message(),
            error_code,
        },
    }
}

#[cfg(test)]
#[path = "reception_tests.rs"]
mod tests;
