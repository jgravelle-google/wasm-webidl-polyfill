;; WebIDL
(@webidl type $int int)
(@webidl type $string DOMString)
(@webidl type $intCallback TempCallback)

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
  (result
    (as (webidl-type $int) (idx 0))
  )
)
(@webidl func-binding
  export "_Z11getCallbackv"
  (result
    (lift-func-idx
      (type $intCallback)
      (table "__indirect_function_table")
      (idx 0)
    )
  )
)
(@webidl func-binding
  export "_Z20callImportedCallbackPFviE"
  (param
    (lower-func-idx
      (table "__indirect_function_table")
      (get 0)
    )
  )
)
