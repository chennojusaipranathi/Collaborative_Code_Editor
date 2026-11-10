import { env } from "../../config/env.js";
import * as judge0 from "./judge0Provider.js";
import * as mock from "./mockProvider.js";

const providers = { judge0, mock };

// The only function the rest of the app calls
export function executeCode(request) {
  const provider = providers[env.executionProvider];
  if (!provider) throw new Error(`Unknown EXECUTION_PROVIDER: ${env.executionProvider}`);
  return provider.run(request);
}