(import "host" "console_log"
  ;; void console_log(char*)
  (func $console_log (param i32))
)
(import "host" "document_title"
  ;; int document_title()
  (func $document_title (result i32))
)

(import "env" "memory" (memory $0 256 256))

;; C-style string
(data (i32.const 16) "Hello world\00")

(func $main (export "main")
  (local $ptr i32)

  ;; console_log("Hello world")
  (call $console_log (i32.const 16))

  ;; ptr = document_title()
  (call $document_title)
  (local.set $ptr)
  ;; console_log(ptr)
  (call $console_log (local.get $ptr))
)

(func $alloc (export "alloc") (param i32) (result i32)
  (i32.const 1024)
)
