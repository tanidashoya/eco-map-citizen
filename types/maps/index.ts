export interface Point {
  id: string;
  lat: number;
  lng: number;
  // title: string;
  imageUrl?: string;
  comment?: string;
  shootingDate?: string;
}

export interface MapWrapperProps {
  pointsWithImages: Point[];
}

export interface MapProps {
  pointsWithImages: Point[];
}
