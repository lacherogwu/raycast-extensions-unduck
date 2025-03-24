import { type LaunchProps, getPreferenceValues, showToast, Toast, open } from "@raycast/api";
import { bangs, type Bang } from "./bang";

interface Preferences {
  defaultBang?: string;
}

const preferences = getPreferenceValues<Preferences>();

export default async function main(props: LaunchProps<{ arguments: Arguments.Search }>) {
  const { query } = props.arguments;
  let q = query ?? props.fallbackText;

  snap: if (q.includes("@")) {
    const match = q.match(/@(\S+)/i);
    const snapCandidate = match?.[1]?.toLowerCase();
    if (!snapCandidate) break snap;

    const selectedBang = bangs.find((b) => b.t === snapCandidate);
    if (!selectedBang) break snap;

    q = q.replace(/@\S+\s*/i, "").trim();
    q += ` site:${selectedBang.d}`;
  }

  const LS_DEFAULT_BANG = preferences.defaultBang ?? "g";
  const defaultBang = bangs.find((b) => b.t === LS_DEFAULT_BANG);

  const searchUrl = getBangredirectUrl(q, defaultBang);

  if (!searchUrl) {
    showToast({ title: "No search query found.", style: Toast.Style.Failure });
    return;
  }

  await open(searchUrl);
}

function getBangredirectUrl(query: string, defaultBang?: Bang) {
  const match = query.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = (bangCandidate && bangs.find((b) => b.t === bangCandidate)) || defaultBang;
  if (!selectedBang) return null;

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
  );
  if (!searchUrl) return null;

  return searchUrl;
}
