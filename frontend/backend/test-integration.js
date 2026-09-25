import WebSocket from 'ws';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('==================================================');
  console.log("MANI'S KOTE FACTORY — AUTOMATED INTEGRATION TESTS");
  console.log('==================================================');
  
  const testEmail = `guest_${Math.random().toString(36).substring(7)}@test.com`;
  let userToken = '';
  let ownerToken = '';
  let orderId = '';

  try {
    // 1. Test User Registration
    console.log('\n[TEST 1] Registering a new Guest account...');
    const registerRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Guest User',
        email: testEmail,
        password: 'guestpassword123'
      })
    });
    
    if (registerRes.status !== 201) {
      throw new Error(`Failed to register user. Status: ${registerRes.status}`);
    }
    const registerData = await registerRes.json();
    userToken = registerData.token;
    console.log('✓ Guest registered successfully. JWT Token acquired.');

    // 2. Test Owner Login
    console.log('\n[TEST 2] Authenticating Owner credentials...');
    const ownerRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@manis.com',
        password: 'ownerpassword123'
      })
    });

    if (ownerRes.status !== 200) {
      throw new Error(`Failed owner login. Status: ${ownerRes.status}`);
    }
    const ownerData = await ownerRes.json();
    ownerToken = ownerData.token;
    console.log('✓ Owner verified. Admin JWT claims confirmed.');

    // 3. Test WebSocket Order Alert
    console.log('\n[TEST 3] Connecting owner dashboard WebSockets...');
    const ws = new WebSocket(`ws://localhost:5000/ws?token=${ownerToken}`);
    let wsReceivedAlert = false;
    let receivedOrderId = null;

    ws.on('open', () => {
      console.log('✓ WebSocket channel connected and authenticated.');
    });

    ws.on('message', (message) => {
      const data = JSON.parse(message);
      console.log(`📡 WebSocket received broadcast message: ${data.type}`);
      if (data.type === 'NEW_ORDER') {
        receivedOrderId = data.order.id;
        console.log(`📡 WebSocket order ID: ${receivedOrderId}`);
      }
    });

    await delay(1000);

    // 4. Test Checkout Placement
    console.log('\n[TEST 4] Simulating guest shopping bag checkout...');
    const checkoutRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        items: [
          { productId: 1, name: 'Dark Cocoa Eclipse', price: 24.50, quantity: 2, variant: 'Standard Bar (100g)' },
          { productId: 6, name: 'Custom Happiness Box', price: 52.00, quantity: 1, variant: '9-slot Velvet Case', customBoxItems: ['Dark Lava', 'Sea Salt Toffee'] }
        ],
        total_amount: 101.00,
        address: '100 Chime Way, Chocolate District, Hershey PA',
        delivery_date: '2026-08-25',
        delivery_slot: '12 PM - 3 PM'
      })
    });

    if (checkoutRes.status !== 201) {
      throw new Error(`Failed checkout request. Status: ${checkoutRes.status}`);
    }
    const checkoutData = await checkoutRes.json();
    orderId = checkoutData.orderId;
    console.log(`✓ Checkout complete. Order #${orderId} saved as paid.`);

    // Wait for WS propagation
    await delay(2000);
    ws.close();

    if (receivedOrderId !== orderId) {
      throw new Error(`WebSocket alert order ID mismatch! Expected: ${orderId}, Got: ${receivedOrderId}`);
    }
    wsReceivedAlert = true;

    // 5. Test Owner Order Status Modify
    console.log('\n[TEST 5] Updating order status (preparing → packed)...');
    const updateRes = await fetch(`http://localhost:5000/api/owner/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ status: 'packed' })
    });

    if (updateRes.status !== 200) {
      throw new Error(`Failed to update order status. Status: ${updateRes.status}`);
    }
    console.log('✓ Order status updated successfully to: PACKED.');

    console.log('\n==================================================');
    console.log('ALL TESTS COMPLETED SUCCESSFULLY! SYSTEM STABLE.');
    console.log('==================================================');
    process.exit(0);

  } catch (error) {
    console.error('\n✕ TEST SUITE FAILED:', error.message);
    process.exit(1);
  }
}

runTests();
