(import "host" "console_log"
  ;; void console_log(char*)
  (func $console_log (param i32))
)
(import "host" "document_title"
  ;; int document_title(char*, int)
  (func $document_title (param i32 i32) (result i32))
)

(import "env" "memory" (memory $0 256 256))

(export "main" (func $main))

;; C-style string
(data (i32.const 16) "Hello world\00")

(func $main
  (local $ptr i32)

  ;; console_log("Hello world")
  (call $console_log (i32.const 16))

  ;; ;; ptr = 128
  ;; (local.set $ptr (i32.const 128))
  ;; ;; len = document_title(ptr, 128)
  ;; (drop
  ;;   (call $document_title
  ;;     (local.get $ptr)  ;; address
  ;;     (i32.const 128) ;; buffer size = 128
  ;;   )
  ;; )
  ;; ;; console_log(ptr)
  ;; (call $console_log (local.get $ptr))
)

(;webidl
  (webidl-func-binding
    import "host" "console_log"
    (param
      (utf8-cstr (type DOMString) (off-idx 0))
    )
  )
webidl;)
