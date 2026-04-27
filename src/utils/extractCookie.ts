/**
 * Extracts the Roblox security cookie token from arbitrary input.
 * The token always begins with `_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_`
 * followed by the actual session string. We capture the warning prefix and
 * everything that follows up until whitespace (the cookie value contains no
 * whitespace).
 *
 * Returns the full matched token, or null if no token is present.
 */
export const extractRobloxCookie = (input: string): string | null => {
  if (!input) return null;
  const match = input.match(
    /_\|WARNING:-DO-NOT-SHARE-THIS\.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items\.\|_\S+/
  );
  return match ? match[0] : null;
};
