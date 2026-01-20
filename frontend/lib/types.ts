export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Image {
  id: string;
  filename: string;
  width: number;
  height: number;
  annotation_count: number;
  reviewed_at: string | null;
}

export interface Annotation {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  source: 'manual' | 'yolo';
  confidence: number | null;
}

export interface AnnotateImageData {
  id: string;
  filename: string;
  url: string;
  width: number;
  height: number;
  boxes: AnnotateBox[];
}

export interface AnnotateBox {
  id?: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
}

export interface AnnotateExportData {
  dataset: string;
  images: AnnotateImageData[];
  annotations: any[];
}

export interface AnnotatePageHeaderProps {
  datasetName: string;
}

export interface DatasetWithStats extends Dataset {
  totalImages: number;
  annotatedImages: number;
  reviewedImages: number;
  starred?: boolean;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
}

export interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => void;
  onSignUpClick: () => void;
  isLoading: boolean;
  error?: string;
}

export interface SignupFormProps {
  onSignup: (credentials: SignupCredentials) => void;
  onLoginClick: () => void;
  isLoading: boolean;
  error?: string;
}

export interface CreateDatasetInput {
  name: string;
  description?: string;
}

export interface DatasetsStats {
  totalDatasets: number;
  totalImages: number;
  totalAnnotated: number;
}

export interface DatasetCardProps {
  dataset: DatasetWithStats;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
}

export interface DatasetsGridProps {
  datasets: DatasetWithStats[];
  onOpenDataset: (id: string) => void;
  onDeleteDataset: (id: string) => void;
  onToggleStar: (id: string) => void;
  onCreateClick: () => void;
}

export interface DatasetsStatsBarProps {
  stats: DatasetsStats;
}

export interface CreateDatasetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: CreateDatasetInput) => void;
  isCreating: boolean;
}

export interface DatasetsPageHeaderProps {
  onCreateClick: () => void;
}

export interface DatasetCardProps {
  dataset: DatasetWithStats;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onUpload: (id: string) => void; // ← Add this
}

export interface DatasetsGridProps {
  datasets: DatasetWithStats[];
  onOpenDataset: (id: string) => void;
  onDeleteDataset: (id: string) => void;
  onToggleStar: (id: string) => void;
  onUpload: (id: string) => void; // ← Add this
  onCreateClick: () => void;
}