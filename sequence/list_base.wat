(module
  (type (;0;) (func (param i32)))
  (type (;1;) (func (param i32) (result i32)))
  (type (;2;) (func (param i32 i32)))
  (type (;3;) (func (param i32 i32 i32) (result i32)))
  (import "js" "logStr" (func $log_char_const*_ (type 0)))
  (import "js" "log" (func $log_int_ (type 0)))
  (func $alloc_int_ (type 1) (param i32) (result i32)
    (local i32)
    (i32.store offset=1024
      (i32.const 0)
      (i32.add
        (local.tee 1
          (i32.load offset=1024
            (i32.const 0)))
        (local.get 0)))
    (local.get 1))
  (func $strlen_char_const*_ (type 1) (param i32) (result i32)
    (local i32 i32 i32)
    (block  ;; label = @1
      (br_if 0 (;@1;)
        (i32.load8_u
          (local.get 0)))
      (return
        (i32.const 0)))
    (local.set 1
      (i32.add
        (local.get 0)
        (i32.const 1)))
    (local.set 0
      (i32.const 0))
    (loop  ;; label = @2
      (local.set 2
        (i32.add
          (local.get 1)
          (local.get 0)))
      (local.set 0
        (local.tee 3
          (i32.add
            (local.get 0)
            (i32.const 1))))
      (br_if 0 (;@2;)
        (i32.load8_u
          (local.get 2))))
    (local.get 3))
  (func $average_List<int>_ (type 1) (param i32) (result i32)
    (local i32 i32)
    (block  ;; label = @1
      (block  ;; label = @2
        (br_if 0 (;@2;)
          (local.tee 1
            (i32.load
              (local.get 0))))
        (local.set 2
          (i32.const 0))
        (br 1 (;@1;)))
      (local.set 2
        (i32.const 0))
      (loop  ;; label = @3
        (local.set 2
          (i32.add
            (i32.load
              (local.get 1))
            (local.get 2)))
        (br_if 0 (;@3;)
          (local.tee 1
            (i32.load offset=4
              (local.get 1))))))
    (i32.div_s
      (local.get 2)
      (i32.load offset=8
        (local.get 0))))
  (func $reversed_List<int>_ (type 2) (param i32 i32)
    (call $log_char_const*_
      (i32.const 1028))
    (call $log_int_
      (local.get 1))
    (call $log_int_
      (local.tee 0
        (call $List<int>::List__
          (local.get 0))))
    (block  ;; label = @1
      (br_if 0 (;@1;)
        (i32.eqz
          (local.tee 1
            (i32.load offset=4
              (local.get 1)))))
      (loop  ;; label = @2
        (call $List<int>::add_int_
          (local.get 0)
          (i32.load
            (local.get 1)))
        (br_if 0 (;@2;)
          (local.tee 1
            (i32.load offset=8
              (local.get 1)))))))
  (func $List<int>::List__ (type 1) (param i32) (result i32)
    (i32.store offset=8
      (local.get 0)
      (i32.const 0))
    (i64.store align=4
      (local.get 0)
      (i64.const 0))
    (local.get 0))
  (func $List<int>::add_int_ (type 2) (param i32 i32)
    (local i32 i32 i32 i32)
    (call $log_char_const*_
      (i32.const 1040))
    (call $log_int_
      (local.get 1))
    (local.set 2
      (i32.const 0))
    (local.set 3
      (local.get 0))
    (loop  ;; label = @1
      (local.set 4
        (local.get 2))
      (local.set 3
        (i32.add
          (local.tee 2
            (i32.load
              (local.tee 5
                (local.get 3))))
          (i32.const 4)))
      (br_if 0 (;@1;)
        (local.get 2)))
    (drop
      (call $List<int>::Node::Node_int__List<int>::Node*_
        (local.tee 2
          (call $alloc_int_
            (i32.const 12)))
        (local.get 1)
        (local.get 4)))
    (block  ;; label = @2
      (br_if 0 (;@2;)
        (i32.eqz
          (local.get 4)))
      (i32.store offset=4
        (local.get 4)
        (local.get 2)))
    (i32.store
      (local.get 5)
      (local.get 2))
    (i32.store offset=4
      (local.get 0)
      (local.get 2))
    (i32.store offset=8
      (local.get 0)
      (i32.add
        (i32.load offset=8
          (local.get 0))
        (i32.const 1))))
  (func $List<int>::Node::Node_int__List<int>::Node*_ (type 3) (param i32 i32 i32) (result i32)
    (i32.store offset=8
      (local.get 0)
      (local.get 2))
    (i32.store offset=4
      (local.get 0)
      (i32.const 0))
    (i32.store
      (local.get 0)
      (local.get 1))
    (local.get 0))
  (table (;0;) 1 1 funcref)
  (memory (;0;) 2)
  (global (;0;) (mut i32) (i32.const 66592))
  (export "memory" (memory 0))
  (export "__indirect_function_table" (table 0))
  (export "_Z5alloci" (func $alloc_int_))
  (export "_Z6strlenPKc" (func $strlen_char_const*_))
  (export "_Z7average4ListIiE" (func $average_List<int>_))
  (export "_Z8reversed4ListIiE" (func $reversed_List<int>_))
  (export "_ZN4ListIiEC2Ev" (func $List<int>::List__))
  (export "_ZN4ListIiE3addEi" (func $List<int>::add_int_))
  (data (;0;) (i32.const 1024) "\00\10\00\00")
  (data (;1;) (i32.const 1028) "In reversed\00In add\00"))
