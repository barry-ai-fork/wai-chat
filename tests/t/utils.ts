export function getUserIndexFromLocationUrl() {
  const location = window.location;
  const url = new URL(location.href);
  if (!url.searchParams.get('u') || !Number(url.searchParams.get('u'))) {
    return 0;
  } else {
    return Number(url.searchParams.get('u'));
  }
}

export function maskAddress(address: string) {
  return `${address.substring(0, 3)}**${address.substring(address.length - 3)}`;
}
