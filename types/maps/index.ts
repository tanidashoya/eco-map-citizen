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
  currentLocation: { lat: number; lng: number } | null;
  isLocationLoading: boolean;
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

export interface LocationSheetProps {
  selectedPoint: MergedPoint | null;
}

export interface LocationState {
  coords: { lat: number; lng: number } | null;
  error: string | null;
  isLoading: boolean;
}
