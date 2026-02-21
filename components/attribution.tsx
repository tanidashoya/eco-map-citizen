type Props = {
  mapTypePic: boolean;
};

export default function Attribution({ mapTypePic }: Props) {
  return (
    <div className="absolute bottom-1 left-1 text-[12px] lg:text-[14px] leading-[1.2] bg-white/80 py-0.5 px-1.5 rounded z-[1000]">
      {mapTypePic === true ? (
        <>
          ©{" "}
          <a
            href="https://maps.gsi.go.jp/development/ichiran.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            国土地理院
          </a>{" "}
          | © Leaflet
        </>
      ) : (
        <>
          ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            OpenStreetMap contributors
          </a>{" "}
          | © Leaflet
        </>
      )}
    </div>
  );
}
