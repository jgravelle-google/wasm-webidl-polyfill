#ifndef __COMMON_H__
#define __COMMON_H__

#define IMPORT(ns, n) __attribute__((import_module(ns), import_name(n)))
#define EXPORT __attribute__((used))

int allocPtr = 4096;
void* alloc(int size) {
  void* ptr = (void*)allocPtr;
  allocPtr += size;
  return ptr;
}

// Need to provide a placement new because it's defined in libcxx
void* operator new(unsigned long, void* buffer) {
  return buffer;
}

#endif // __COMMON_H__