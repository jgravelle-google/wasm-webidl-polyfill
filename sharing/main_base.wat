(import "env" "memory" (memory $0 256 256))

;; len+chars
(data (i32.const 16) "\0fHello from Rust")

(import "lib" "cLog" (func $cLog (param i32 i32)))

(func $main (export "main")
  (call $cLog
    (i32.const 17)
    (i32.load8_u (i32.const 16))
  )
)
