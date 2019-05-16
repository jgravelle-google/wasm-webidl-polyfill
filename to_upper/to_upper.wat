(import "host" "console_log"
  (func $console_log (param i32))
)
(import "host" "document_title"
  (func $document_title (param i32 i32) (result i32))
)

(import "lib" "to_upper"
  (func $to_upper (param i32) (result i32))
)

(import "env" "memory" (memory $0 256 256))

(export "main" (func $main))

;; C-style string
(data (i32.const 16) "==>\00")

(func $main
  (local $ptr i32)
  (local $len i32)
  (local $idx i32)
  (local $addr i32)

  ;; ptr = 128
  (local.set $ptr (i32.const 128))
  ;; len = document_title(ptr, 128)
  (local.set $len
    (call $document_title
      (local.get $ptr)  ;; address
      (i32.const 128) ;; buffer size = 128
    )
  )
  (call $console_log (local.get $ptr))

  ;; for (idx = 0; i < len; ++idx)
  (local.set $idx (i32.const 0))
  (block $0
    (loop $1
      (br_if $0
        (i32.ge_u (local.get $idx) (local.get $len))
      )
      (local.set $addr
        (i32.add (local.get $ptr) (local.get $idx))
      )
      (i32.store8
        (local.get $addr)
        (call $to_upper
          (i32.load8_u (local.get $addr))
        )
      )
      (local.set $idx (i32.add (local.get $idx) (i32.const 1)))
      (br $1)
    )
  )

  (call $console_log (i32.const 16)) ;; "==>"
  (call $console_log (local.get $ptr))
)

(;func $wasm_to_upper (param $c i32) (result i32)
  (if (result i32)
    ;; c >= 'a' && c <= 'z'
    (i32.and
      (i32.ge_u (local.get $c) (i32.const 97))
      (i32.le_u (local.get $c) (i32.const 112))
    )
    (i32.sub (local.get $c) (i32.const 32))
    (local.get $c)
  )
;)

;; WebIDL
(@webidl type $int int)
(@webidl type $string DOMString)
;; (encode
;;   (domString utf8_nullterm)
;;   (int nativeWasm)
;; )
;; (decode
;;   (domString utf8_outparam_buffer)
;;   (int nativeWasm)
;; )
(@webidl func-binding
  import "host" "console_log"
  static
  (param
    (as (webidl-type $string) (idx 0))
  )
)
(@webidl func-binding
  import "host" "document_title"
  static
  (result
    (as (wasm-type anyref) (get 0))
  )
)
(@webidl func-binding
  import "host" "to_upper"
  static
  (param
    (as (webidl-type $int) (idx 0))
  )
  (result
    (as (wasm-type i32) (get 0))
  )
)
