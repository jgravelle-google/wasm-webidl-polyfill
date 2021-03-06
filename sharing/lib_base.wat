;; void log(RefID, char*);
(import "host" "log" (func $log (param i32 i32)))

(memory (export "memory") 16)
(data (i32.const 16) "Hello from C\00")

;; Store ref ID at addr=32
(func $setRefAddr (param $id i32)
  (i32.store (i32.const 32) (local.get $id))
)
(func $getRefAddr (result i32)
  (i32.load (i32.const 32))
)

(func $init (export "init") (param $console i32)
  (call $setRefAddr (local.get $console))
  (call $log
    (call $getRefAddr)
    (i32.const 16)
  )
)

(func $cLog (export "cLog") (param $ptr i32)
  (call $log
    (call $getRefAddr)
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
