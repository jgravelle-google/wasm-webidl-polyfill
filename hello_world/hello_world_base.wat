(import "host" "console_log"
  ;; void console_log(char*)
  (func $console_log (param i32))
)
(import "host" "document_title"
  ;; int document_title()
  (func $document_title (result i32))
)

(memory (export "memory") 256 256)

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

(func $strlen (export "strlen") (param $ptr i32) (result i32)
  (local $len i32)
  (local $ch i32)
  (loop
    ;; ch = *ptr
    (local.set $ch
      (i32.load8_u (local.get $ptr))
    )
    ;; if (ch == 0) { return len; }
    (if
      (i32.eqz (local.get $ch))
      (return (local.get $len))
    )
    ;; ptr++, len++
    (local.set $ptr
      (i32.add (local.get $ptr) (i32.const 1))
    )
    (local.set $len
      (i32.add (local.get $len) (i32.const 1))
    )
    (br 0)
  )
  (unreachable)
)

(func (export "write_null_byte") (param $ptr i32) (param $len i32) (result i32)
  (i32.store8
    (i32.add (local.get $ptr) (local.get $len))
    (i32.const 0)
  )
  (local.get $ptr)
)
