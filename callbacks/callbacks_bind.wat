;; WebIDL
(@webidl type $int int)
(@webidl type $string DOMString)
(@webidl type $intCallback int)

(@webidl func-binding
  import "env" "console_log"
  static
  (param
    (utf8-cstr (type $string) (off-idx 0))
    (as (webidl-type $int) (idx 1))
  )
)

(@webidl func-binding
  export "_Z11doSomethingv"
  static
  (param
    (as (wasm-type i32) (get 0))
  )
)
(@webidl func-binding
  export "_Z11getCallbackv"
  static
  (result
    (as (webidl-type $intCallback) (idx 0))
  )
)
(@webidl func-binding
  export "_Z20callImportedCallbackPFviE"
  static
  (param
    (as (webidl-type $intCallback) (idx 0))
  )
)
