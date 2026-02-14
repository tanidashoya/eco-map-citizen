import { MapPoint } from "../../types/data-format-generate/types";
import { convertToViewableUrl } from "./convert-to-view-able-url";
import { escapeXml } from "./escape-xml";

export function buildKML(points: MapPoint[], title: string): string {
  const placemarks = points
    .map((point) => {
      // 複数画像を並べて表示（URLを変換）
      const imageHtml = point.imageUrls
        .map(
          (url) =>
            `<img src="${convertToViewableUrl(url)}" width="300" style="max-width:100%; margin:5px 0;" />`,
        )
        .join("<br/>");

      const description = `
      ${imageHtml}
      <p><strong>投稿者:</strong> ${escapeXml(point.description)}</p>
      ${point.comment ? `<p><strong>コメント:</strong><br/>${escapeXml(point.comment).replace(/\n/g, "<br/>")}</p>` : ""}
    `.trim();

      return `
    <Placemark>
      <name>${escapeXml(point.name)}</name>
      <description><![CDATA[${description}]]></description>
      <Point>
        <coordinates>${point.longitude},${point.latitude},0</coordinates>
      </Point>
    </Placemark>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(title)}</name>
    ${placemarks}
  </Document>
</kml>`;
}
