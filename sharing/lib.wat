(import "env" "memory" (memory $0 256 256))
(data (i32.const 16) "Hello from C\00")

(import "host" "getConsole" (func $getConsole (result i32)))
(import "host" "log" (func $log (param i32 i32)))

(global $console (mut i32) (i32.const -1))

(func $init (export "init")
  (global.set $console (call $getConsole))
  (call $log
    (global.get $console)
    (i32.const 16)
  )
)

(func $cLog (export "cLog") (param $ptr i32)
  (call $log
    (global.get $console)
    (local.get $ptr)
  )
)

;; WebIDL
(@webidl type $any any)
(@webidl type $string DOMString)
(@webidl func-binding
  import "host" "getConsole"
  static
  (result
    (as (wasm-type anyref) (get 0))
  )
)
(@webidl func-binding
  import "host" "log"
  static
  (param
    (as (webidl-type $any) (idx 0))
    (utf8-cstr (type $string) (off-idx 1))
  )
)
(@webidl func-binding
  export "cLog"
  (param
    domString ;; utf8_constaddr_1024
  )
)
