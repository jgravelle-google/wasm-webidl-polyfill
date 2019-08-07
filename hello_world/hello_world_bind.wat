;; WebIDL
(@webidl type $string DOMString)
(@webidl func-binding
  import "host" "console_log"
  static
  (param
    (utf8-cstr (type $string) (off-idx 0))
  )
)
(@webidl func-binding
  import "host" "document_title"
  static
  (result
    (alloc-utf8-cstr (alloc-export "alloc") (get 0))
  )
)
