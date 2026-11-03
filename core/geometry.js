const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

export function fitRect(rect, bounds, minimum = { width: 280, height: 200 }) {
  const maxWidth = Math.max(1, bounds.width);
  const maxHeight = Math.max(1, bounds.height);
  const width = clamp(finite(rect.width, minimum.width), Math.min(minimum.width, maxWidth), maxWidth);
  const height = clamp(finite(rect.height, minimum.height), Math.min(minimum.height, maxHeight), maxHeight);
  return {
    left: clamp(finite(rect.left, 0), 0, maxWidth - width),
    top: clamp(finite(rect.top, 0), 0, maxHeight - height),
    width, height,
  };
}

export function resizeRect(rect, edge, dx, dy, bounds, minimum = { width: 280, height: 200 }) {
  const start = fitRect(rect, bounds, minimum);
  let { left, top, width, height } = start;
  const minWidth = Math.min(minimum.width, bounds.width);
  const minHeight = Math.min(minimum.height, bounds.height);
  if (edge.includes('e')) width = clamp(width + dx, minWidth, bounds.width - left);
  if (edge.includes('s')) height = clamp(height + dy, minHeight, bounds.height - top);
  if (edge.includes('w')) {
    left = clamp(left + dx, 0, start.left + start.width - minWidth);
    width = start.left + start.width - left;
  }
  if (edge.includes('n')) {
    top = clamp(top + dy, 0, start.top + start.height - minHeight);
    height = start.top + start.height - top;
  }
  return { left, top, width, height };
}
