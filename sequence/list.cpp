#include "common.h"

IMPORT("js", "log") void log(int);
IMPORT("js", "logStr") void log(const char*);

template <typename T>
struct List {
  struct Node {
    T item;
    Node* next;
    Node* prev;
    Node(T item, Node* prev)
      : item(item), prev(prev), next(nullptr) {}
  } *first, *last;
  int count;

  EXPORT List()
    : first(nullptr), last(nullptr), count(0) {}

  EXPORT void add(T item) {
    log("In add");
    log(item);
    Node** cur = &first;
    Node* prev = nullptr;
    while (*cur != nullptr) {
      prev = *cur;
      cur = &(*cur)->next;
    }
    void* buf = alloc(sizeof(Node));
    Node* node = new (buf) Node(item, prev);
    if (prev != nullptr) {
      prev->next = node;
    }
    *cur = node;
    last = node;
    count++;
  }
};

EXPORT int average(List<int> list) {
  int sum = 0;
  for (auto node = list.first; node != nullptr; node = node->next) {
    sum += node->item;
  }
  return sum / list.count;
}

EXPORT List<int> reversed(List<int> list) {
  log("In reversed");
  log((int)&list);
  List<int> result;
  log((int)&result);
  for (auto node = list.last; node != nullptr; node = node->prev) {
    result.add(node->item);
  }
  return result;
}
