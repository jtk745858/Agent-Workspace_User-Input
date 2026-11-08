use serde_json::{Value, json};
const ID: &str = "550e8400-e29b-41d4-a716-446655440000";

#[test]
fn r000_r001_registered_command_dispatch_and_argument_errors() {
    use tauri::test::{INVOKE_KEY, get_ipc_response, mock_builder, mock_context, noop_assets};
    let app = agent_orchestration_lib::register_commands(mock_builder())
        .build(mock_context(noop_assets()))
        .unwrap();
    let window = tauri::WebviewWindowBuilder::new(&app, "main", Default::default())
        .build()
        .unwrap();
    let call = |args: Value| {
        get_ipc_response(
            &window,
            tauri::webview::InvokeRequest {
                cmd: "receive_user_input".into(),
                callback: tauri::ipc::CallbackFn(0),
                error: tauri::ipc::CallbackFn(1),
                url: "http://tauri.localhost".parse().unwrap(),
                body: tauri::ipc::InvokeBody::Json(args),
                headers: Default::default(),
                invoke_key: INVOKE_KEY.to_string(),
            },
        )
        .map(|body| body.deserialize::<Value>().unwrap())
    };
    for (id, text) in [
        (ID, " A\r\n "),
        ("00000000-0000-4000-8000-000000000002", "한글 😀"),
    ] {
        let args = json!({"request":{"requestId":id,"rawText":text}});
        assert_eq!(
            call(args).unwrap(),
            json!({"status":"received","requestId":id,"receivedText":text})
        );
    }
    assert_eq!(
        call(json!({"request":{"requestId":ID,"rawText":"!!!"}})).unwrap()["errorCode"],
        "INVALID_INPUT"
    );
    assert!(call(json!({"request":{"requestId":ID,"rawText":"A","extra":true}})).is_err());
    assert!(call(json!({"requestId":ID,"rawText":"A"})).is_err());
}
