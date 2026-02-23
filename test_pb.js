const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('https://pocketbase.startfranchise.id');

async function test() {
    await pb.admins.authWithPassword('startfranchise.id@gmail.com', 'Admin.startfranchise@123');

    // Test creating an outlet
    try {
        const outlet = await pb.collection('expo_outlets').create({
            name: "Test Outlet",
            brand_name: "Test Brand",
            access_token: "TEST-XXXXX",
            is_active: true
        });
        console.log("Create Outlet OK:", outlet.id);

        // Test fetching without sort
        const noSort = await pb.collection('expo_outlets').getFullList();
        console.log("Fetch No Sort OK. Count:", noSort.length);

        // Test fetching with sort
        const withSort = await pb.collection('expo_outlets').getFullList({ sort: '-created' });
        console.log("Fetch With Sort OK. Count:", withSort.length);
    } catch (e) {
        console.error("Test Error:", e.message);
        if (e.response && e.response.data) console.error(JSON.stringify(e.response.data, null, 2));
    }
}

test().catch(console.error);
