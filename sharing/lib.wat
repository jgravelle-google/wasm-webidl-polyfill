(import "env" "memory" (memory $0 256 256))
(data (i32.const 16) "Hello from C\00")

(import "host" "log" (func $log (param anyref i32)))

(table 1 anyref)

(func $readTable (result anyref)
  (table.get 0 (i32.const 0))
)

(func $init (export "init") (param $console anyref)
  (table.set 0 (i32.const 0) (local.get $console))
  (call $log
    (call $readTable)
    (i32.const 16)
  )
)

(func $cLog (export "cLog") (param $ptr i32)
  (call $log
    (call $readTable)
    (local.get $ptr)
  )
)

(func $constaddr_1024 (export "constaddr_1024") (result i32)
  (i32.const 1024)
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
    (alloc-utf8-cstr (alloc-export "constaddr_1024") (get 0))
  )
)
