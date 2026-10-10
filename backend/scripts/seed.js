const path = require('path');
const { connectDB, disconnectDB } = require('../src/config/db');
const Report = require('../src/models/Report');
const Incident = require('../src/models/Incident');
const User = require('../src/models/User');

/**
 * Database seeding script for Ocean Hazard Platform.
 * Imports mock data from frontend contract layer and upserts into MongoDB.
 * Safe to rerun idempotently without duplicating records.
 */
async function seedDatabase() {
  console.log('====================================================');
  console.log('🌊 Ocean Hazard Platform - Database Seeder');
  console.log('====================================================\n');

  try {
    // 1. Establish MongoDB Connection
    await connectDB();

    // 2. Ensure and verify indexes (specifically 2dsphere indexes)
    console.log('[1/5] Initializing and verifying database indexes...');
    await Promise.all([Report.init(), Incident.init(), User.init()]);

    const reportIndexes = await Report.collection.indexes();
    const incidentIndexes = await Incident.collection.indexes();

    const reportHas2dSphere = reportIndexes.some(
      (idx) => idx.key && idx.key.location === '2dsphere'
    );
    const incidentHas2dSphere = incidentIndexes.some(
      (idx) => idx.key && idx.key.centroid === '2dsphere'
    );

    if (!reportHas2dSphere) {
      throw new Error('Missing required 2dsphere index on Report.location');
    }
    if (!incidentHas2dSphere) {
      throw new Error('Missing required 2dsphere index on Incident.centroid');
    }

    console.log('  ✓ 2dsphere index verified on Report.location');
    console.log('  ✓ 2dsphere index verified on Incident.centroid');

    // 3. Dynamically import sample datasets from frontend mock layer
    console.log('\n[2/5] Importing mock datasets from frontend contracts...');
    const { mockReports } = await import('../../src/mocks/mockReports.js');
    const { mockIncidents } = await import('../../src/mocks/mockIncidents.js');

    console.log(`  ✓ Loaded ${mockReports.length} sample reports`);
    console.log(`  ✓ Loaded ${mockIncidents.length} sample incidents`);

    // 4. Upsert Incidents (including PURI-042)
    console.log('\n[3/5] Seeding Incidents into MongoDB...');
    const incidentMap = new Map(); // customId -> incident document

    for (const inc of mockIncidents) {
      const incidentPayload = {
        customId: inc.id,
        hazardType: inc.hazardType,
        severity: inc.severity,
        confidence: inc.confidence,
        centroid: {
          type: 'Point',
          coordinates: inc.location.centroid // [lng, lat] GeoJSON
        },
        location: {
          name: inc.location.name,
          centroid: inc.location.centroid,
          radiusMeters: inc.location.radiusMeters || 1200
        },
        locationName: inc.location.name,
        radiusMeters: inc.location.radiusMeters || 1200,
        reportCount: inc.reportCount || 1,
        reportIds: [], // Will link with report ObjectIds after reports are seeded
        firstReportedAt: new Date(inc.firstReportedAt || Date.now()),
        lastReportedAt: new Date(inc.lastReportedAt || Date.now()),
        status: inc.status || 'active',
        verificationStatus: inc.verificationStatus || 'unverified'
      };

      const savedIncident = await Incident.findOneAndUpdate(
        { customId: inc.id },
        { $set: incidentPayload },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      incidentMap.set(inc.id, savedIncident);
      console.log(`  • Incident ${inc.id} (${inc.location.name}) saved.`);
    }

    // 5. Upsert Reports
    console.log('\n[4/5] Seeding 18 Sample Reports into MongoDB...');
    const reportDocs = [];

    for (const rep of mockReports) {
      const reportPayload = {
        customId: rep.id,
        text: rep.text,
        photoUrl: rep.photoUrl || null,
        location: {
          type: 'Point',
          coordinates: rep.location.coordinates, // [lng, lat] GeoJSON
          name: rep.location.name,
          raw: rep.location.raw,
          source: rep.location.source || 'extracted'
        },
        locationName: rep.location.name,
        hazard: {
          type: rep.hazard.type,
          secondaryTypes: rep.hazard.secondaryTypes || [],
          confidence: rep.hazard.confidence || 0.85
        },
        hazardType: rep.hazard.type,
        secondaryHazardTypes: rep.hazard.secondaryTypes || [],
        confidence: rep.hazard.confidence || 0.85,
        severity: rep.severity || 'medium',
        incidentId: rep.incidentId || null,
        status: rep.status || 'unverified',
        source: rep.source || 'citizen',
        createdAt: new Date(rep.createdAt || Date.now())
      };

      const savedReport = await Report.findOneAndUpdate(
        { customId: rep.id },
        { $set: reportPayload },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      reportDocs.push(savedReport);
      console.log(`  • Report ${rep.id} [${rep.hazard.type}] -> Incident: ${rep.incidentId || 'None'}`);
    }

    // 6. Link Report ObjectIds back to their parent Incidents
    console.log('\n[5/5] Synchronizing Incident -> Report relationship references...');
    for (const [incId, incDoc] of incidentMap.entries()) {
      const matchingReports = reportDocs.filter((r) => r.incidentId === incId);
      const matchingReportObjectIds = matchingReports.map((r) => r._id);

      await Incident.updateOne(
        { _id: incDoc._id },
        {
          $set: {
            reportIds: matchingReportObjectIds,
            reportCount: Math.max(incDoc.reportCount, matchingReportObjectIds.length)
          }
        }
      );

      console.log(`  • Linked ${matchingReportObjectIds.length} reports to Incident ${incId}`);
    }

    // 7. Seed Demo Administrator User (USR-014)
    await User.findOneAndUpdate(
      { customId: 'USR-014' },
      {
        $set: {
          customId: 'USR-014',
          name: 'Demo Admin',
          role: 'admin',
          email: 'admin@oceanhazard.gov'
        }
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    console.log('  ✓ Demo Admin user (USR-014) seeded.');

    // 8. Verification Checks
    console.log('\n====================================================');
    console.log('📊 Verification Summary');
    console.log('====================================================');

    const totalReports = await Report.countDocuments();
    const totalIncidents = await Incident.countDocuments();
    const totalUsers = await User.countDocuments();

    console.log(`Total Reports in DB:   ${totalReports}`);
    console.log(`Total Incidents in DB: ${totalIncidents}`);
    console.log(`Total Users in DB:     ${totalUsers}`);

    // Verify PURI-042 specifically
    const puriIncident = await Incident.findOne({ customId: 'PURI-042' }).populate('reportIds');
    const puriReports = await Report.find({ incidentId: 'PURI-042' });

    console.log('\nPURI-042 Specific Audit:');
    console.log(`  Centroid:             [${puriIncident.centroid.coordinates.join(', ')}] (GeoJSON [lng, lat])`);
    console.log(`  Hazard Type:          ${puriIncident.hazardType}`);
    console.log(`  Severity:             ${puriIncident.severity}`);
    console.log(`  Linked Reports Count: ${puriReports.length}`);
    console.log(`  Report IDs:           ${puriReports.map((r) => r.customId).join(', ')}`);
    console.log(`  Incident.reportIds:   ${puriIncident.reportIds.length} populated references`);

    console.log('\n✅ Database seeding successfully completed.\n');
  } catch (error) {
    console.error('\n❌ Seeding failed with error:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

// Execute if run directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
