;; (import "env" "refs" (table $refs 16 anyref))
(import "env" "memory" (memory $0 256 256))
(data (i32.const 16) "Hello console\00")
(data (i32.const 32) "Goodbye console\00")

(import "host" "getConsole" (func $getConsole (result anyref)))
(import "host" "log" (func $log (param anyref i32)))

(func $main (export "main")
  (local $console anyref)
  (local.set $console (call $getConsole))
  (call $log
    (local.get $console)
    (i32.const 16)
  )

  (call $log
    (local.get $console)
    (i32.const 32)
  )
)

(;webidl
  (webidl-func-binding
    import "host" "getConsole"
    (result
      (as (wasm-type anyref) (get 0))
    )
  )
  (webidl-func-binding
    import "host" "log"
    (param
      (as (webidl-type any) (idx 0))
      (utf8-cstr (type DOMString) (off-idx 1))
    )
  )
webidl;)