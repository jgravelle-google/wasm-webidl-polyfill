#include "common.h"

template <typename T>
struct List {
  struct Node {
    T item;
    Node* prev;
    Node* next;
    Node(T item, Node* prev)
      : item(item), prev(prev), next(nullptr) {}
  } *first, *last;
  int count;

  EXPORT List()
    : first(nullptr), last(nullptr), count(0) {}

  EXPORT void add(T item) {
    Node** cur = &first;
    Node* prev = nullptr;
    while (*cur != nullptr) {
      prev = *cur;
      cur = &cur->next;
    }
    Node* node = (Node*)alloc(sizeof(Node));
    new (node) Node();
    node->prev = prev;
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
  List<int> result;
  for (auto node = list.last; node != nullptr; node = node->prev) {
    result.add(node->item);
  }
  return result;
}
