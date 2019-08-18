(import "document" "getElementById"
  (func $document_getElementById (param i32) (result i32))
)
(import "host" "getContext"
  (func $getContext (param i32 i32) (result i32))
)
(import "host" "fillRect"
  (func $fillRect (param i32 f32 f32 f32 f32))
)
(import "host" "setFillStyle"
  (func $setFillStyle (param i32 i32))
)

(memory (export "memory") 16)

(data (i32.const 16) "a-canvas\00") ;; canvas ID
(data (i32.const 32) "2d\00")       ;; 2D context
(data (i32.const 48) "#ff2020\00")  ;; red color

(func (export "main")
  (local $canvas i32)
  (local $context i32)
  (local.set $canvas
    (call $document_getElementById
      (i32.const 16)
    )
  )
  (local.set $context
    (call $getContext
      (local.get $canvas)
      (i32.const 32)
    )
  )
  (call $fillRect
    (local.get $context)
    (f32.const 100)
    (f32.const 100)
    (f32.const 200)
    (f32.const 200)
  )

  (call $setFillStyle
    (local.get $context)
    (i32.const 48)
  )
  (call $fillRect
    (local.get $context)
    (f32.const 175)
    (f32.const 175)
    (f32.const 200)
    (f32.const 200)
  )
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
