function getImageMetadata(buffer, mimeType) {
  if (!buffer || !buffer.length) {
    return { width: null, height: null };
  }

  try {
    if (mimeType === "image/png" && buffer.length >= 24) {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20)
      };
    }

    if (mimeType === "image/gif" && buffer.length >= 10) {
      return {
        width: buffer.readUInt16LE(6),
        height: buffer.readUInt16LE(8)
      };
    }

    if (mimeType === "image/webp") {
      return parseWebp(buffer);
    }

    if (mimeType === "image/jpeg") {
      return parseJpeg(buffer);
    }
  } catch (error) {
    return { width: null, height: null };
  }

  return { width: null, height: null };
}

function parseJpeg(buffer) {
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      break;
    }

    const marker = buffer[offset + 1];
    const blockLength = buffer.readUInt16BE(offset + 2);

    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7)
      };
    }

    offset += 2 + blockLength;
  }

  return { width: null, height: null };
}

function parseWebp(buffer) {
  if (buffer.length < 30) {
    return { width: null, height: null };
  }

  const chunkHeader = buffer.toString("ascii", 12, 16);

  if (chunkHeader === "VP8 ") {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff
    };
  }

  if (chunkHeader === "VP8L") {
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];

    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6))
    };
  }

  if (chunkHeader === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3)
    };
  }

  return { width: null, height: null };
}

module.exports = {
  getImageMetadata
};
