import PocketBase from 'pocketbase';

export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// Disable auto-cancellation for realtime
pb.autoCancellation(false);

/**
 * Get the file URL for a PocketBase record
 */
export function getFileUrl(record: { id: string; collectionId: string; collectionName: string }, filename: string): string {
    if (!filename) return '';
    return `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${record.collectionId}/${record.id}/${filename}`;
}

/**
 * Get brand logo URL from a Brand record
 */
export function getBrandLogoUrl(brand: { id: string; collectionId: string; collectionName: string; logo: string } | undefined): string {
    if (!brand?.logo) return '';
    return `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${brand.collectionId}/${brand.id}/${brand.logo}`;
}
