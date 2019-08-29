#ifndef __COMMON_H__
#define __COMMON_H__

#define IMPORT(ns, n) __attribute__((import_module(ns), import_name(n)))
#define EXPORT __attribute__((used))

int allocPtr = 4096;
EXPORT void* alloc(int size) {
  void* ptr = (void*)allocPtr;
  allocPtr += size;
  return ptr;
}

// Need to provide a placement new because it's defined in libcxx
void* operator new(unsigned long, void* buffer) {
  return buffer;
}

EXPORT int strlen(const char* str) {
  int len = 0;
  while (*str++) len++;
  return len;
}

#endif // __COMMON_H__
