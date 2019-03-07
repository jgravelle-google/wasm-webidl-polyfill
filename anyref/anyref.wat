;; (import "env" "refs" (table $refs 16 anyref))
(import "env" "memory" (memory $0 256 256))
(data (i32.const 16) "Hello console\00")
(data (i32.const 32) "Goodbye console\00")

(import "host" "getConsole" (func $getConsole (result i32)))
(import "host" "log" (func $log (param i32 i32)))

(func $main (export "main")
  (local $console i32)
  (local.set $console (call $getConsole))
  (call $log
    (local.get $console)
    (i32.const 16)
  )

  (if
    ;; assert console == getConsole()
    (i32.eq
      (local.get $console)
      (call $getConsole)
    )
    (call $log
      (call $getConsole)
      (i32.const 32)
    )
    (unreachable)
  )
)

(;webidl
  (encode
    (domString utf8_nullterm)
    (anyref opaque_ptr_get)
  )
  (decode
    (domString utf8_outparam_buffer)
    (anyref opaque_ptr_set)
  )
  (declarations
    (import "host" "getConsole" (result anyref))
    (import "host" "log" (param anyref domString))
  )
webidl;)
