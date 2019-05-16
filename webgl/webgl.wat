(import "env" "memory" (memory $0 256 256))
(data (i32.const 16) "a-canvas\00") ;; canvas ID
(data (i32.const 32) "2d\00")       ;; 2D context
(data (i32.const 48) "#ff2020\00")  ;; red color

(import "document" "getElementById"
  (func $document_getElementById (param i32) (result anyref))
)
(import "host" "getContext"
  (func $getContext (param anyref i32) (result anyref))
)
(import "host" "fillRect"
  (func $fillRect (param anyref f32 f32 f32 f32))
)
(import "host" "setFillStyle"
  (func $setFillStyle (param anyref i32))
)

(func $main (export "main")
  (local $canvas anyref)
  (local $context anyref)
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

;; WebIDL
(@webidl type $any any)
(@webidl type $float float)
(@webidl type $string DOMString)
(@webidl func-binding
  import "document" "getElementById"
  static
  (param
    (utf8-cstr (type $string) (off-idx 0))
  )
  (result (as (wasm-type anyref) (get 0)))
)
(@webidl func-binding
  import "host" "getContext"
  method
  (param
    (as (webidl-type $any) (idx 0))
    (utf8-cstr (type $string) (off-idx 1))
  )
  (result (as (wasm-type anyref) (get 0)))
)
(@webidl func-binding
  import "host" "setFillStyle"
  static
  (param
    (as (webidl-type $any) (idx 0))
    (utf8-cstr (type $string) (off-idx 1))
  )
)
(@webidl func-binding
  import "host" "fillRect"
  method
  (param
    (as (webidl-type $any) (idx 0))
    (as (webidl-type $float) (idx 1))
    (as (webidl-type $float) (idx 2))
    (as (webidl-type $float) (idx 3))
    (as (webidl-type $float) (idx 4))
  )
)
