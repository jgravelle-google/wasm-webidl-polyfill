#define IMPORT(ns, n) __attribute__((import_module(ns), import_name(n)))
#define EXPORT __attribute__((used))

int allocPtr = 2048;

struct Comment {
  char* message;
  int score;
};

extern "C" {
  EXPORT void* alloc(int size) {
    void* ptr = (void*)allocPtr;
    allocPtr += size + 1;
    return ptr;
  }
  EXPORT int strlen(char* str) {
    int len = 0;
    while (*str++) len++;
    return len;
  }
  EXPORT char* writeNullByte(char* str, int len) {
    str[len] = 0;
    return str;
  }

  EXPORT char* getMessage(Comment* comment) {
    return comment->message;
  }
  EXPORT int getScore(Comment* comment) {
    return comment->score;
  }
  EXPORT Comment* makeComment(char* message, int score) {
    Comment* result = (Comment*)alloc(sizeof(Comment));
    result->message = message;
    result->score = score;
    return result;
  }
}

const int kMaxComments = 16;
Comment storedComments[kMaxComments];
int numComments = 0;

IMPORT("js", "display")
void display(Comment comment);

template <typename T>
void swap(T& a, T& b) {
  T t = a;
  a = b;
  b = t;
}

void sortComments() {
  // Selection sort
  for (int i = 0; i < numComments - 1; ++i) {
    int best = i;
    for (int j = i + 1; j < numComments; ++j) {
      if (storedComments[best].score < storedComments[j].score) {
        best = j;
      }
    }
    if (best != i) {
      swap(storedComments[best], storedComments[i]);
    }
  }
}

extern "C" {
  EXPORT void addComment(Comment comment) {
    storedComments[numComments++] = comment;
  }

  EXPORT void displayAll(void) {
    sortComments();
    for (int i = 0; i < numComments; ++i) {
      display(storedComments[i]);
    }
  }
}
