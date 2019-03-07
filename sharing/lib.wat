(import "env" "memory" (memory $0 256 256))
(data (i32.const 16) "Hello from C\00")

(import "host" "getConsole" (func $getConsole (result i32)))
(import "host" "log" (func $log (param i32 i32)))

(global $console (mut i32) (i32.const -1))

(func $init (export "init")
  (global.set $console (call $getConsole))
)

(func $cLog (export "cLog") (param $ptr i32)
  (call $log
    (global.get $console)
    (local.get $ptr)
  )
)

(;webidl
  (encode
    (domString utf8_nullterm)
    (anyref opaque_ptr_get)
  )
  (decode
    (domString utf8_constaddr_1024)
    (anyref opaque_ptr_set)
  )
  (declarations
    (import "host" "getConsole" (result anyref))
    (import "host" "log" (param anyref domString))
    (export "cLog" (param domString))
  )
webidl;)
