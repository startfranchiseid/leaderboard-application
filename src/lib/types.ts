export interface Brand {
    id: string;
    name: string;
    category: string;
    logo: string;
    color: string;
    icon: string;
    website: string;
    collectionId: string;
    collectionName: string;
}

export interface ExpoOutlet {
    id: string;
    name: string;
    brand_name: string;
    brand?: string; // relation ID to brands
    access_token: string;
    is_active: boolean;
    created: string;
    updated: string;
    collectionId: string;
    collectionName: string;
    expand?: {
        brand?: Brand;
    };
}

export interface Deal {
    id: string;
    nama_mitra: string;
    foto_mitra: string;
    brand_name: string;
    brand?: string; // relation ID to brands
    outlet_name: string;
    lokasi_buka_outlet: string;
    jumlah_transaksi: number;
    catatan: string;
    expo_outlet: string;
    created: string;
    updated: string;
    collectionId: string;
    collectionName: string;
    expand?: {
        brand?: Brand;
        expo_outlet?: ExpoOutlet;
    };
}

export interface LeaderboardEntry {
    nama_mitra: string;
    foto_mitra: string;
    foto_url: string;
    brand_name: string; // fallback string
    brands_dealt: string[]; // List of unique brand names
    brand_logo_url?: string;
    lokasi_buka_outlet: string;
    total_transaksi: number;
    deal_count: number;
    latest_deal: string;
    deals: Deal[];
}
