type Props = {
  mapTypePic: boolean;
};

export default function Attribution({ mapTypePic }: Props) {
  return (
    <div className="absolute bottom-1 left-1 text-[12px] lg:text-[14px] leading-[1.2] bg-white/80 py-0.5 px-1.5 rounded z-[1000]">
      {mapTypePic === true ? (
        // OpenFreeMap (Bright スタイル)
        // 公式アトリビューション形式: "OpenFreeMap © OpenMapTiles Data from OpenStreetMap"
        <>
          <a
            href="https://openfreemap.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            OpenFreeMap
          </a>{" "}
          ©{" "}
          <a
            href="https://openmaptiles.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            OpenMapTiles
          </a>{" "}
          Data from{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            OpenStreetMap
          </a>
        </>
      ) : (
        // 国土地理院 航空写真
        <>
          ©{" "}
          <a
            href="https://maps.gsi.go.jp/development/ichiran.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            国土地理院
          </a>
        </>
      )}
    </div>
  );
}
