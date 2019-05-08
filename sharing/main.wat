(import "env" "memory" (memory $0 256 256))

;; len+chars
(data (i32.const 16) "\15Hello from Rust")

(import "lib" "cLog" (func $cLog (param i32 i32)))

(func $main (export "main")
  (call $cLog
    (i32.const 17)
    (i32.load8_u (i32.const 16))
  )
)

;; WebIDL
(@webidl type $string DOMString)
(@webidl func-binding
  import "lib" "cLog"
  (param
    (utf8-cstr (type $string) (off-idx 0))
  )
)
