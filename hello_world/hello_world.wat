(import "host" "console_log"
  ;; void console_log(char*)
  (func $console_log (param i32))
)
(import "host" "document_title"
  ;; int document_title(char*, int)
  (func $document_title (result i32))
)

(import "env" "memory" (memory $0 256 256))

(export "main" (func $main))

;; C-style string
(data (i32.const 16) "Hello world\00")

(func $main
  (local $ptr i32)

  ;; console_log("Hello world")
  (call $console_log (i32.const 16))

  ;; ptr = document_title()
  (local.set $ptr (call $document_title))
  ;; console_log(ptr)
  (call $console_log (local.get $ptr))
)

(func $alloc (export "alloc") (param i32) (result i32)
  (i32.const 1024)
)

(;webidl
  (webidl-func-binding
    import "host" "console_log"
    (param
      (utf8-cstr (type DOMString) (off-idx 0))
    )
  )
  (webidl-func-binding
    import "host" "document_title"
    (result
      (alloc-utf8-cstr (alloc-export "alloc"))
    )
  )
webidl;)
