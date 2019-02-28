(module
  (import "host" "console_log"
    (func $console_log (param i32))
  )
  (import "host" "document_title"
    (func $document_title (param i32 i32))
  )

  (import "env" "memory" (memory $0 256 256))

  (export "main" (func $main))

  ;; C-style string
  (data (i32.const 16) "Hello world\00")

  (func $main
    (call $console_log (i32.const 16))

    (call $document_title
      (i32.const 32)  ;; address = 32
      (i32.const 128) ;; buffer size = 128
    )
    (call $console_log (i32.const 32))
  )

  (;webidl
    (encode
      (domString utf8_nullterm)
    )
    (decode
      (domString utf8_outparam_buffer)
    )
    (declarations
      (import "host" "console_log" (param domString))
      (import "host" "document_title" (result domString))
    )
  webidl;)
)
