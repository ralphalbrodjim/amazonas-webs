/** Which copy to keep when a phone opens the site. Authoritative cloud rows are never replaced by leftover local text. */
export function chooseIncoming(opts: {
  remoteExists: boolean;
  remote: unknown;
  local: unknown;
  authoritative: boolean;
  remoteEmpty: boolean;
  localEmpty: boolean;
}): { use: "remote" | "local" | "none"; value: unknown } {
  if (opts.authoritative) {
    if (opts.remoteExists) return { use: "remote", value: opts.remote };
    return { use: "none", value: undefined };
  }
  if (opts.remoteExists) {
    if (opts.remoteEmpty && !opts.localEmpty) return { use: "local", value: opts.local };
    return { use: "remote", value: opts.remote };
  }
  if (!opts.localEmpty) return { use: "local", value: opts.local };
  return { use: "none", value: undefined };
}
