const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = 'Request failed';
    
    try {
      const error = await response.json();
      errorMessage = error.detail || error.message || JSON.stringify(error);
    } catch {
      errorMessage = response.statusText || 'Request failed';
    }

    if (response.status === 401) {
      errorMessage = errorMessage === 'Unauthorized' ? 'Invalid email or password' : errorMessage;
    } else if (response.status === 404) {
      errorMessage = 'No account found';
    } else if (response.status === 409) {
      errorMessage = 'Email already registered';
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// Auth
export async function register(email: string, password: string) {
  return fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string) {
  return fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return fetchAPI('/auth/logout', { method: 'POST' });
}

export async function getCurrentUser() {
  return fetchAPI('/auth/me');
}

// Datasets
export async function getDatasets() {
  return fetchAPI('/datasets');
}

export async function createDataset(name: string, description?: string) {
  return fetchAPI('/datasets', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

export async function getDataset(datasetId: string) {
  return fetchAPI(`/datasets/${datasetId}`);
}

export async function deleteDataset(datasetId: string) {
  return fetchAPI(`/datasets/${datasetId}`, {
    method: 'DELETE',
  });
}

// Images
export async function uploadImages(datasetId: string, files: File[]) {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  const response = await fetch(`${API_URL}/datasets/${datasetId}/images`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }
  
  return response.json();
}

export async function getImages(datasetId: string) {
  return fetchAPI(`/datasets/${datasetId}/images`);
}

export function getImageUrl(imageId: string) {
  return `${API_URL}/images/${imageId}/file`;
}

// Annotations
export async function getAnnotations(imageId: string) {
  return fetchAPI(`/images/${imageId}/annotations`);
}

export async function saveAnnotations(imageId: string, annotations: any[]) {
  return fetchAPI(`/images/${imageId}/annotations`, {
    method: 'PUT',
    body: JSON.stringify({ annotations }),
  });
}

export async function markReviewed(imageId: string) {
  return fetchAPI(`/images/${imageId}/reviewed`, {
    method: 'POST',
  });
}

// Jobs
export async function startPrelabel(datasetId: string, agentMode: boolean, goal: string, instructions?: string) {
  return fetchAPI(`/datasets/${datasetId}/prelabel?agent_mode=${agentMode}`, {
    method: 'POST',
    body: JSON.stringify({ goal, instructions }),
  });
}

export async function getJobStatus(jobId: string) {
  return fetchAPI(`/jobs/${jobId}`);
}

export async function exportDataset(datasetId: string) {
  const response = await fetch(`${API_URL}/datasets/${datasetId}/export`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Export failed' }));
    throw new Error(error.detail || 'Export failed');
  }

  const blob = await response.blob();
  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}