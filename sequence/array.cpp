#include "common.h"

IMPORT("js", "log") void log(int);
IMPORT("js", "logStr") void log(const char*);

template <typename T>
class Array {
  T* buffer;
  int capacity;
  int count;

public:
  EXPORT Array() {
    log("In Array()");
    log((int)this);
    capacity = 16;
    buffer = (T*)alloc(capacity * sizeof(T));
    count = 0;
  }

  EXPORT void add(T item) {
    log("In add(item)");
    log(item);
    if (count == capacity) {
      capacity *= 2;
      T* newbuffer = (T*)alloc(capacity * sizeof(T));
      for (int i = 0; i < count; ++i) {
        newbuffer[i] = buffer[i];
      }
      buffer = newbuffer;
    }
    buffer[count] = item;
    count++;
  }

  EXPORT int length() {
    return count;
  }

  T& operator[](int index) {
    return buffer[index];
  }
};

EXPORT int average(Array<int> array) {
  int sum = 0;
  log("In average");
  log(array.length());
  for (int i = 0; i < array.length(); ++i) {
    log("---");
    sum += array[i];
    log(i); log(array[i]); log(sum);
  }
  return sum / array.length();
}

EXPORT Array<int> reversed(Array<int> array) {
  log("In reversed");
  log(array.length());
  Array<int> result;
  for (int i = 0; i < array.length(); ++i) {
    result.add(array[array.length() - i - 1]);
  }
  return result;
}
