export function downloadDataUrl(dataUrl: string, fileName: string) {
  const anchor = document.createElement("a");

  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}

export function createDatedPngFileName(prefix: string) {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.png`;
}
