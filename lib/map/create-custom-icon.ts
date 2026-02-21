import L from "leaflet";
export default function createCustomIcon(imageUrl: string, count: number) {
  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 4px rgba(0,0,0,0.35));">
        
        <!-- バッジ -->
        ${
          count > 1
            ? `<div style="
                  position:absolute;
                  top:-6px;
                  right:-6px;
                  background:#22c55e;
                  color:white;
                  font-size:12px;
                  font-weight:bold;
                  width:22px;
                  height:22px;
                  border-radius:9999px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  border:2px solid white;
                ">
                  ${count}
                </div>`
            : ""
        }
  
          <!-- 画像部分 -->
          <div style="width:54px;height:54px;border-radius:20%;overflow:hidden;border:3px solid white;background:white;">
            <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />
          </div>
  
          <!-- 三角ピン -->
          <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:12px solid white;margin-top:-1px;"></div>
        </div>
      `,
    className: "",
    iconSize: [60, 69],
    iconAnchor: [30, 69],
  });
}
