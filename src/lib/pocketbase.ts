import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);

// Disable auto-cancellation for realtime
pb.autoCancellation(false);

/**
 * Get the file URL for a PocketBase record
 */
export function getFileUrl(record: { id: string; collectionId: string; collectionName: string }, filename: string): string {
    if (!filename) return '';
    return `${PUBLIC_POCKETBASE_URL}/api/files/${record.collectionId}/${record.id}/${filename}`;
}
