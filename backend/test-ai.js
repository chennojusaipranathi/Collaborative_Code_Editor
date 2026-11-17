import "dotenv/config";
import { askAI } from "./services/ai/index.js";

const reply = await askAI({
  action: "explain",
  fileName: "Main.java",
  language: "java",
  code: 'public class Main { public static void main(String[] a){ System.out.println("hi"); } }',
});
console.log("REPLY:", reply);