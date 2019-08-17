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

(func (export "constaddr_1024") (result i32)
  (i32.const 1024)
)

(func (export "strlen") (param $ptr i32) (result i32)
  (local $len i32)
  (local $ch i32)
  (loop
    (local.set $ch
      (i32.load8_u (local.get $ptr))
    )
    (if
      (i32.eqz (local.get $ch))
      (return (local.get $len))
    )
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
