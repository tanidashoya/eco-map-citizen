export interface Point {
  uniqueId: string;
  category: string;
  imageUrl: string;
  name?: string;
  address?: string;
  birthdate?: string;
  comment?: string;
  latitude: number;
  longitude: number;
  shootingDate: string;
}

export interface MapProps {
  mergedPoints: MergedPoint[];
  initialCenter: [number, number];
  currentLocation: { lat: number; lng: number } | null;
  isLocationLoading: boolean;
}

export interface ClusterItem {
  uniqueId: string;
  category: string;
  name?: string;
  imageUrl: string;
  comment?: string;
  shootingDate: string;
}

export interface MergedPoint {
  latitude: number;
  longitude: number;
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
