'use strict';

const fs = require('fs');
const path = require('path');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');

function parseBounds(value) {
  const match = String(value || '').match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!match) return null;
  const [, left, top, right, bottom] = match.map(Number);
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    right,
    bottom
  };
}

function expandBounds(bounds, image, padding = 24) {
  const x = Math.max(0, Math.floor(bounds.x - padding));
  const y = Math.max(0, Math.floor(bounds.y - padding));
  const right = Math.min(image.width, Math.ceil(bounds.x + bounds.width + padding));
  const bottom = Math.min(image.height, Math.ceil(bounds.y + bounds.height + padding));
  return { x, y, width: right - x, height: bottom - y };
}

function findQrBoundsInSource(sourceXml, { contentDesc = /qr\s*code/i } = {}) {
  if (!sourceXml) return null;
  const nodePattern = /<[^>]+>/g;
  let match;
  while ((match = nodePattern.exec(sourceXml))) {
    const node = match[0];
    const desc = (node.match(/content-desc="([^"]*)"/) || [])[1] || '';
    if (!contentDesc.test(desc)) continue;
    const bounds = parseBounds((node.match(/bounds="([^"]*)"/) || [])[1]);
    if (bounds) return { bounds, node };
  }
  return null;
}

function cropPng(png, bounds) {
  const crop = new PNG({ width: bounds.width, height: bounds.height });
  for (let y = 0; y < bounds.height; y++) {
    for (let x = 0; x < bounds.width; x++) {
      const sourceIdx = ((png.width * (bounds.y + y)) + (bounds.x + x)) << 2;
      const targetIdx = ((bounds.width * y) + x) << 2;
      crop.data[targetIdx] = png.data[sourceIdx];
      crop.data[targetIdx + 1] = png.data[sourceIdx + 1];
      crop.data[targetIdx + 2] = png.data[sourceIdx + 2];
      crop.data[targetIdx + 3] = png.data[sourceIdx + 3];
    }
  }
  return crop;
}

function decodeQrFromPngBuffer(buffer, { bounds, padding = 24, attempts = [] } = {}) {
  const image = PNG.sync.read(buffer);
  const candidates = [];
  if (bounds) candidates.push(expandBounds(bounds, image, padding));
  candidates.push({ x: 0, y: 0, width: image.width, height: image.height });
  for (const extra of attempts) {
    if (extra && Number.isFinite(extra.x)) candidates.unshift(expandBounds(extra, image, padding));
  }

  for (const candidate of candidates) {
    const crop = cropPng(image, candidate);
    const decoded = jsQR(crop.data, crop.width, crop.height, { inversionAttempts: 'attemptBoth' });
    if (decoded && decoded.data) {
      return {
        ok: true,
        data: decoded.data,
        bounds: candidate,
        location: decoded.location || null
      };
    }
  }
  return { ok: false, data: null, bounds: bounds || null, reason: 'qr_not_decoded' };
}

function decodeQrFromArtifacts({ screenshotPath, sourcePath, bounds, outputCropPath, padding = 24 } = {}) {
  if (!screenshotPath) throw new Error('screenshotPath is required');
  const screenshot = fs.readFileSync(screenshotPath);
  let resolvedBounds = bounds ? parseBounds(bounds) || bounds : null;
  if (!resolvedBounds && sourcePath && fs.existsSync(sourcePath)) {
    const found = findQrBoundsInSource(fs.readFileSync(sourcePath, 'utf8'));
    resolvedBounds = found && found.bounds;
  }
  const result = decodeQrFromPngBuffer(screenshot, { bounds: resolvedBounds, padding });
  if (outputCropPath && resolvedBounds) {
    const image = PNG.sync.read(screenshot);
    const crop = cropPng(image, expandBounds(resolvedBounds, image, padding));
    fs.mkdirSync(path.dirname(outputCropPath), { recursive: true });
    fs.writeFileSync(outputCropPath, PNG.sync.write(crop));
  }
  return {
    ...result,
    screenshot: screenshotPath,
    source: sourcePath || null
  };
}

module.exports = {
  cropPng,
  decodeQrFromArtifacts,
  decodeQrFromPngBuffer,
  findQrBoundsInSource,
  parseBounds
};
