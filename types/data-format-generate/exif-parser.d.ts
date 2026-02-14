declare module "exif-parser" {
  interface ExifTags {
    GPSLatitude?: number;
    GPSLongitude?: number;
    DateTimeOriginal?: number;
    [key: string]: unknown;
  }

  interface ExifResult {
    tags: ExifTags;
  }

  interface ExifParser {
    parse(): ExifResult;
  }

  function create(buffer: Buffer): ExifParser;

  export = { create };
}
