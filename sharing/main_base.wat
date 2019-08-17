(import "lib" "cLog" (func $cLog (param i32 i32)))

(memory (export "memory") 16)

;; len+chars
(data (i32.const 16) "\0fHello from Rust")

(func $main (export "main")
  (call $cLog
    (i32.const 17)
    (i32.load8_u (i32.const 16))
  )
)
