export interface Point {
  uniqueId: string;
  stamp: string;
  lat: number;
  lng: number;
  name?: string;
  imageUrl?: string;
  comment?: string;
  shootingDate?: string;
  location?: string;
}

export interface MapWrapperProps {
  pointsWithImages: Point[];
}

export interface MapProps {
  mergedPoints: MergedPoint[];
  initialCenter: [number, number];
}

export interface ClusterItem {
  uniqueId: string;
  stamp: string;
  name?: string;
  imageUrl?: string;
  comment?: string;
  shootingDate?: string;
  location?: string;
}

export interface MergedPoint {
  lat: number;
  lng: number;
  items: ClusterItem[];
}
