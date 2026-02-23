export interface FormValues {
  name: string;
  address: string;
  birthdate: string;
  comment: string;
}

export interface PreviewImage {
  /** ブラウザ上でのプレビュー用 ObjectURL */
  previewUrl: string;
  /** 実際に送信する File オブジェクト */
  file: File;
}

export interface ImageUploaderProps {
  image: PreviewImage | null;
  disabled?: boolean;
  onImageChange: (image: PreviewImage | null) => void;
}
