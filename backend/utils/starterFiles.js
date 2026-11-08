// The first file created with every new room (moved here from the old mock)
export const STARTER_FILES = {
  JavaScript: { name: "main.js", content: 'console.log("Hello, CodeSync!");\n' },
  TypeScript: { name: "main.ts", content: 'console.log("Hello, CodeSync!");\n' },
  Python: { name: "main.py", content: 'print("Hello, CodeSync!")\n' },
  Java: {
    name: "Main.java",
    content:
      'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, CodeSync!");\n  }\n}\n',
  },
  "C++": {
    name: "main.cpp",
    content:
      '#include <iostream>\n\nint main() {\n  std::cout << "Hello, CodeSync!" << std::endl;\n  return 0;\n}\n',
  },
};