export function squareCrop(width: number, height: number, zoom: number, panX: number, panY: number) {
  if (![width, height, zoom, panX, panY].every(Number.isFinite) || width <= 0 || height <= 0) {
    throw new RangeError("Invalid image crop dimensions.");
  }
  const size = Math.min(width, height) / Math.max(1, Math.min(4, zoom));
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  return {
    x: clamp(panX) * (width - size),
    y: clamp(panY) * (height - size),
    size,
    outputSize: Math.max(1, Math.min(800, Math.round(size))),
  };
}

export function cropSquarePhoto(image: HTMLImageElement, zoom: number, panX: number, panY: number): string {
  const crop = squareCrop(image.naturalWidth, image.naturalHeight, zoom, panX, panY);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = crop.outputSize;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível abrir a imagem.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}
