(module
  (type (;0;) (func (param i32 i32)))
  (type (;1;) (func (param i32)))
  (import "env" "console_log" (func $console_log (type 0)))
  (import "env" "callCallback" (func $callCallback (type 1)))
  (func $logNumber_int_ (type 1) (param i32)
    (call $console_log
      (i32.const 1028)
      (local.get 0))
    (i32.store offset=1024
      (i32.const 0)
      (local.get 0)))
  (func $doSomething__ (type 1) (param i32)
    (local i32 i32)
    (call $console_log
      (i32.const 1046)
      (i32.load offset=1024
        (i32.const 0)))
    (call $callCallback
      (i32.const 1))
    (i32.store
      (local.get 0)
      (local.tee 1
        (i32.load offset=1024
          (i32.const 0))))
    (i32.store offset=4
      (local.get 0)
      (local.tee 2
        (select
          (i32.const 1071)
          (i32.const 1088)
          (i32.gt_s
            (local.get 1)
            (i32.const 10)))))
    (call $console_log
      (i32.const 1105)
      (local.get 1))
    (call $console_log
      (local.get 2)
      (local.get 1)))
  (table (;0;) 2 2 funcref)
  (memory (;0;) 2)
  (global (;0;) (mut i32) (i32.const 66672))
  (export "memory" (memory 0))
  (export "__indirect_function_table" (table 0))
  (export "_Z11doSomethingv" (func $doSomething__))
  (elem (;0;) (i32.const 1) $logNumber_int_)
  (data (;0;) (i32.const 1024) "\00\00\00\00")
  (data (;1;) (i32.const 1028) "in logNumber, x =\00in logNumber, lastSeen =\00struct: Over ten\00struct: underten\00after callback, lastSeen =\00"))

;; WebIDL
(@webidl type $int int)
(@webidl type $string DOMString)
(@webidl func-binding
  import "env" "console_log"
  static
  (param
    (utf8-cstr (type $string) (off-idx 0))
    (as (webidl-type $int) (idx 1))
  )
)
