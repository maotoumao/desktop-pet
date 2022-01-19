export default function (query: string) {
  const url = window.location.href;
  const urlObj = new URL(url);
  return urlObj.searchParams.get(query);
}
