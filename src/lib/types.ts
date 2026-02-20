export interface ExpoOutlet {
    id: string;
    name: string;
    brand_name: string;
    access_token: string;
    is_active: boolean;
    created: string;
    updated: string;
}

export interface Deal {
    id: string;
    nama_mitra: string;
    foto_mitra: string;
    brand_name: string;
    outlet_name: string;
    lokasi_buka_outlet: string;
    jumlah_transaksi: number;
    catatan: string;
    expo_outlet: string;
    created: string;
    updated: string;
    collectionId: string;
    collectionName: string;
}

export interface LeaderboardEntry {
    nama_mitra: string;
    foto_mitra: string;
    foto_url: string;
    brand_name: string;
    lokasi_buka_outlet: string;
    total_transaksi: number;
    deal_count: number;
    latest_deal: string;
    deals: Deal[];
}
