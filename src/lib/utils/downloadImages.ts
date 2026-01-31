import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const CONCURRENCY_LIMIT = 5;

export async function downloadImagesAsZip(bucket: string, zipFilename: string) {
  // Fetch signed URLs
  const res = await fetch(`/api/admin/responses/export/images?bucket=${encodeURIComponent(bucket)}`);
  if (!res.ok) throw new Error('Failed to fetch image URLs');
  const { files } = await res.json();

  if (!files || files.length === 0) {
    throw new Error('No images found in this bucket');
  }

  const zip = new JSZip();

  // Fetch images in parallel with concurrency limit
  const queue = [...files];
  const fetchImage = async (file: { path: string; url: string }) => {
    try {
      const response = await fetch(file.url);
      if (!response.ok) return;
      const blob = await response.blob();
      zip.file(file.path, blob);
    } catch (e) {
      console.error(`Failed to fetch ${file.path}:`, e);
    }
  };

  // Process in batches
  while (queue.length > 0) {
    const batch = queue.splice(0, CONCURRENCY_LIMIT);
    await Promise.all(batch.map(fetchImage));
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipFilename);
}
