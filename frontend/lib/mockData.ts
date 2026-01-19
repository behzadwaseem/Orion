import type { Dataset } from "./types"

export const mockDatasets: Dataset[] = [
  {
    id: "1",
    name: "Human Pose Dataset",
    description: "Full body pose estimation training data",
    totalImages: 1250,
    annotatedImages: 892,
    updatedAt: "2024-01-20",
    starred: true,
  },
  {
    id: "2",
    name: "Hand Gestures v2",
    description: "Hand keypoint annotations for gesture recognition",
    totalImages: 540,
    annotatedImages: 540,
    updatedAt: "2024-01-18",
    starred: false,
  },
  {
    id: "3",
    name: "Face Landmarks",
    description: "Facial keypoint detection dataset",
    totalImages: 2100,
    annotatedImages: 1456,
    updatedAt: "2024-01-19",
    starred: true,
  },
  {
    id: "4",
    name: "Animal Poses",
    description: "Quadruped pose estimation for wildlife tracking",
    totalImages: 320,
    annotatedImages: 89,
    updatedAt: "2024-01-12",
    starred: false,
  },
]
