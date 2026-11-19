require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { MONGO_URI } = require('./backend/src/config/env');
const Incident = require('./backend/src/models/Incident');
(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to DB:', mongoose.connection.name);
    console.log('📁 Collection used by Incident model:', Incident.collection.name);
    const doc = await Incident.findOne({ customId: 'GPSPIN-952' });
    if (doc) {
      console.log('🔎 Found document:');
      console.log(JSON.stringify(doc.toObject(), null, 2));
    } else {
      console.log('❌ No document found for customId GPSPIN-952');
    }
  } catch (err) {
    console.error('Error during check:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔚 Disconnected');
  }
})();