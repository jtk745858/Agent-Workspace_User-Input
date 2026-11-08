use super::*;
use serde_json::{Value, json};

const ID: &str = "550e8400-e29b-41d4-a716-446655440000";

fn receive(id: &str, text: &str) -> Value {
    let request = serde_json::from_value(json!({"requestId":id,"rawText":text})).unwrap();
    serde_json::to_value(receive_user_input(request)).unwrap()
}

fn expect_received(id: &str, text: &str) {
    assert_eq!(
        receive(id, text),
        json!({"requestId":id,"status":"received","receivedText":text})
    );
}

fn expect_rejected(id: &str, text: &str, code: &str) {
    let response = receive(id, text);
    let message = response["message"].as_str().unwrap();
    assert!(!message.trim().is_empty());
    assert_eq!(
        response,
        json!({"requestId":id,"status":"rejected","errorCode":code,"message":message})
    );
}

#[test]
fn r100_r101_r102_shared_unicode_cases_and_exact_schemas() {
    #[derive(Deserialize)]
    struct Cases {
        valid: Vec<String>,
        invalid: Vec<String>,
    }
    let cases: Cases =
        serde_json::from_str(include_str!("../../tests/reception-content.json")).unwrap();
    for text in cases.valid {
        expect_received(ID, &text);
    }
    for text in cases.invalid {
        expect_rejected(ID, &text, "INVALID_INPUT");
    }
}

#[test]
fn r100_unicode_data_version() {
    assert_eq!(unicode_properties::UNICODE_VERSION, (17, 0, 0));
    assert_eq!(unicode_segmentation::UNICODE_VERSION, (17, 0, 0));
}

#[test]
fn r100_utf8_boundary_and_error_priority() {
    for text in ["a".repeat(8192), "한".repeat(2730) + "ab"] {
        assert_eq!(text.len(), 8192);
        expect_received(ID, &text);
        expect_rejected(ID, &(text + "a"), "INPUT_TOO_LONG");
    }
    // MT-R100-15: 한글 UTF-8 바이트 경계 검증
    let valid_korean = "가".repeat(2730) + "AB";
    let invalid_korean = "가".repeat(2731);

    assert_eq!(valid_korean.len(), 8192);
    assert_eq!(invalid_korean.len(), 8193);

    expect_received(ID, &valid_korean);
    expect_rejected(ID, &invalid_korean, "INPUT_TOO_LONG");

    let oversized = "!".repeat(8193);
    expect_rejected(ID, &oversized, "INPUT_TOO_LONG");
    expect_rejected("bad", &oversized, "INVALID_REQUEST_ID");
}

#[test]
fn r100_uuid_version_variant_case_and_spelling() {
    for id in [
        "bad",
        "",
        &ID.to_uppercase(),
        &ID.replace("-4", "-1"),
        &ID.replace("-a716", "-7716"),
        &ID.replace('-', ""),
        &format!("{ID}\n"),
    ] {
        expect_rejected(id, "", "INVALID_REQUEST_ID");
    }
    for variant in ["8", "9", "a", "b"] {
        expect_received(&ID.replace("-a716", &format!("-{variant}716")), "A");
    }
}

#[test]
fn r002_deserialization_fails_before_content_checks() {
    for malformed in [
        Value::Null,
        json!({}),
        json!({"requestId":ID}),
        json!({"rawText":"A"}),
        json!({"requestId":null,"rawText":"A"}),
        json!({"requestId":ID,"rawText":null}),
        json!({"requestId":2,"rawText":"A"}),
        json!({"requestId":ID,"rawText":2}),
        json!({"requestId":ID,"rawText":"A","extra":true}),
        json!({"request_id":ID,"rawText":"A"}),
        json!({"requestId":true,"rawText":"A"}),
        json!({"requestId":ID,"rawText":false}),
        json!({"requestId":["123"],"rawText":"A"}),
        json!({"requestId":ID,"rawText":["A"]}),
    ] {
        assert!(serde_json::from_value::<Request>(malformed).is_err());
    }
    assert!(serde_json::from_str::<Request>(r#"{"requestId":"bad","rawText":"A\ud800"}"#).is_err());
}
