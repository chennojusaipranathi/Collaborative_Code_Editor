import { useEffect, useState } from "react";

// Returns the milliseconds left until `endsAt`.
// `serverNow` is the server's clock when the data was sent. We measure how far
// the browser clock is from it, so a wrong local clock cannot change the timer.
export default function useCountdown(endsAt, serverNow) {
  const [offset] = useState(() => serverNow - Date.now());
  const [remaining, setRemaining] = useState(() => endsAt - (Date.now() + offset));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(endsAt - (Date.now() + offset));
    }, 1000);
    return () => clearInterval(id); // cleanup, same habit as event listeners
  }, [endsAt, offset]);

  return remaining;
}