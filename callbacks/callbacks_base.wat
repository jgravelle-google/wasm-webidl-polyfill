(module
  (type (;0;) (func (param i32)))
  (type (;1;) (func (param i32 i32)))
  (type (;2;) (func (result i32)))
  (import "env" "console_log" (func $console_log (type 1)))
  (import "env" "callCallback" (func $callCallback (type 0)))
  (func $logNumber_int_ (type 0) (param i32)
    (call $console_log
      (i32.const 1028)
      (local.get 0))
    (i32.store offset=1024
      (i32.const 0)
      (local.get 0)))
  (func $doSomething__ (type 0) (param i32)
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
          (i32.const 1073)
          (i32.const 1090)
          (i32.gt_s
            (local.get 1)
            (i32.const 10)))))
    (call $console_log
      (i32.const 1107)
      (local.get 1))
    (call $console_log
      (local.get 2)
      (local.get 1)))
  (func $getCallback__ (type 2) (result i32)
    (i32.const 1))
  (func $callImportedCallback_void__*__int__ (type 0) (param i32)
    (call_indirect (type 0)
      (i32.const 3)
      (local.get 0))
    (call_indirect (type 0)
      (i32.const 5)
      (local.get 0)))
  (table (;0;) 2 funcref) ;; Manually edited!
  (memory (;0;) 2)
  (global (;0;) (mut i32) (i32.const 66688))
  (export "memory" (memory 0))
  (export "__indirect_function_table" (table 0))
  (export "_Z11doSomethingv" (func $doSomething__))
  (export "_Z11getCallbackv" (func $getCallback__))
  (export "_Z20callImportedCallbackPFviE" (func $callImportedCallback_void__*__int__))
  (elem (;0;) (i32.const 1) $logNumber_int_)
  (data (;0;) (i32.const 1024) "\00\00\00\00")
  (data (;1;) (i32.const 1028) "in logNumber, x =\00in doSomething, lastSeen =\00struct: Over ten\00struct: underten\00after doSomething callback, lastSeen =\00"))
