export interface Point {
  id: string;
  lat: number;
  lng: number;
  name: string;
  imageUrl?: string;
  comment?: string;
  shootingDate?: string;
}

export interface MapWrapperProps {
  pointsWithImages: Point[];
}

export interface MapProps {
  mergedPoints: MergedPoint[];
  initialCenter: [number, number];
}

export interface ClusterItem {
  name: string;
  imageUrl?: string;
  comment?: string;
  shootingDate?: string;
}

export interface MergedPoint {
  id: string;
  lat: number;
  lng: number;
  items: ClusterItem[];
}
