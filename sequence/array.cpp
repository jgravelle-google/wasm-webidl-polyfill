#include "common.h"

template <typename T>
class Array {
  T* buffer;
  int capacity;
  int count;

public:
  EXPORT Array() {
    capacity = 16;
    buffer = (T*)alloc(capacity * sizeof(T));
    count = 0;
  }

  EXPORT void add(T item) {
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

  int length() {
    return count;
  }

  T& operator[](int index) {
    return buffer[index];
  }
};

EXPORT int average(Array<int> array) {
  int sum = 0;
  for (int i = 0; i < array.length(); ++i) {
    sum += array[i];
  }
  return sum / array.length();
}

EXPORT Array<int> reversed(Array<int> array) {
  Array<int> result;
  for (int i = 0; i < array.length(); ++i) {
    result.add(array[array.length() - i - 1]);
  }
  return result;
}
