const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://pocketbase.startfranchise.id');

async function updateRules() {
    try {
        await pb.admins.authWithPassword('startfranchise.id@gmail.com', 'Admin.startfranchise@123');
        console.log("Authenticated successfully.");

        // Update Brands to be publicly readable
        await pb.collections.update('brands123456789', {
            listRule: '',
            viewRule: '',
            createRule: '',
            updateRule: '',
            deleteRule: ''
        });

        // Update Outlets to be publicly readable/writable (for the forms)
        await pb.collections.update('expooutlets1234', {
            listRule: '',
            viewRule: '',
            createRule: '',
            updateRule: '',
            deleteRule: ''
        });

        // Update Deals to be publicly readable/writable (for the forms)
        await pb.collections.update('deals1234567890', {
            listRule: '',
            viewRule: '',
            createRule: '',
            updateRule: '',
            deleteRule: ''
        });

        console.log("✅ API Rules updated successfully to allow public access.");
    } catch (error) {
        console.error("❌ Failed:", error.message);
        if (error.response?.data) console.error(JSON.stringify(error.response.data, null, 2));
    }
}

updateRules();
