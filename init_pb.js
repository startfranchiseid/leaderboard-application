// Import pocketbase 
const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://pocketbase.startfranchise.id');

async function createCollections() {
    try {
        console.log("Please authenticate as admin...");
        await pb.admins.authWithPassword('startfranchise.id@gmail.com', 'Admin.startfranchise@123');
        console.log("Authenticated successfully.");

        // Clean up empty collections first
        console.log("Cleaning up old empty collections...");
        try { await pb.collections.delete('deals'); } catch (e) { }
        try { await pb.collections.delete('expo_outlets'); } catch (e) { }
        try { await pb.collections.delete('brands'); } catch (e) { }

        console.log("Creating new collections with flattened fields array (for PB 0.23+)...");

        // 1. Create Brands
        const brandsCollection = await pb.collections.create({
            id: 'brands123456789',
            name: 'brands',
            type: 'base',
            listRule: '',
            viewRule: '',
            createRule: '',
            updateRule: '',
            deleteRule: '',
            fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'category', type: 'text' },
                { name: 'logo', type: 'file', maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp'] },
                { name: 'color', type: 'text' },
                { name: 'icon', type: 'file', maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp'] },
                { name: 'website', type: 'url' }
            ]
        });
        console.log("✅ Created 'brands' collection.");

        // 2. Create Expo Outlets
        const outletsCollection = await pb.collections.create({
            id: 'expooutlets1234',
            name: 'expo_outlets',
            type: 'base',
            listRule: '',
            viewRule: '',
            createRule: '',
            updateRule: '',
            deleteRule: '',
            fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'brand_name', type: 'text' },
                { name: 'brand', type: 'relation', collectionId: 'brands123456789', cascadeDelete: false, maxSelect: 1 },
                { name: 'access_token', type: 'text', required: true },
                { name: 'is_active', type: 'bool' }
            ]
        });
        console.log("✅ Created 'expo_outlets' collection.");

        // 3. Create Deals
        const dealsCollection = await pb.collections.create({
            id: 'deals1234567890',
            name: 'deals',
            type: 'base',
            listRule: '',
            viewRule: '',
            createRule: '',
            updateRule: '',
            deleteRule: '',
            fields: [
                { name: 'nama_mitra', type: 'text', required: true },
                { name: 'foto_mitra', type: 'file', required: true, maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp'] },
                { name: 'brand_name', type: 'text', required: true },
                { name: 'brand', type: 'relation', collectionId: 'brands123456789', cascadeDelete: false, maxSelect: 1 },
                { name: 'outlet_name', type: 'text', required: true },
                { name: 'lokasi_buka_outlet', type: 'text', required: true },
                { name: 'jumlah_transaksi', type: 'number', required: true, min: 0 },
                { name: 'catatan', type: 'text' },
                { name: 'expo_outlet', type: 'relation', required: true, collectionId: 'expooutlets1234', cascadeDelete: false, maxSelect: 1 }
            ]
        });
        console.log("✅ Created 'deals' collection.");

        console.log("🎉 All collections created successfully!");

    } catch (error) {
        console.error("❌ Failed to create collections:", error.message);
        if (error.response?.data) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else if (error.originalError) {
            console.error("Original Error:", error.originalError);
        } else {
            console.error("Raw Error Object:", error);
        }
    }
}

createCollections();
