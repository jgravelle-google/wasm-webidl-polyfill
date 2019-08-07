typedef void (*intCallback)(int);

extern "C" {
  void callCallback(intCallback);
  void console_log(const char*, int);
}

struct VisibleStruct {
  int intField;
  const char* strField;
};

int lastSeen;

void logNumber(int x) {
  console_log("in logNumber, x =", x);
  lastSeen = x;
}

__attribute__((used))
VisibleStruct doSomething() {
  VisibleStruct obj;
  console_log("in doSomething, lastSeen =", lastSeen);
  callCallback(logNumber);
  obj.intField = lastSeen;
  if (lastSeen > 10) {
    obj.strField = "struct: Over ten";
  } else {
    obj.strField = "struct: underten";
  }
  console_log("after doSomething callback, lastSeen =", lastSeen);
  console_log(obj.strField, obj.intField);
  return obj;
}

__attribute__((used))
intCallback getCallback() {
  return &logNumber;
}
