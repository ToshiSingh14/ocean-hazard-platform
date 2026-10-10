const mongoose = require('mongoose');

/**
 * Validates GeoJSON [longitude, latitude] coordinates.
 */
const validateGeoCoordinates = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lng, lat] = coords;
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    !isNaN(lng) &&
    !isNaN(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
};

const incidentSchema = new mongoose.Schema(
  {
    // Unique incident identifier (e.g. "PURI-042", "PARADIP-018")
    customId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true
    },

    // Dominant hazard category
    hazardType: {
      type: String,
      required: [true, 'Hazard type is required'],
      enum: [
        'coastal_flooding',
        'abnormal_waves',
        'storm_surge',
        'coastal_erosion',
        'marine_incident',
        'none/low-signal',
        'other'
      ],
      default: 'coastal_flooding'
    },

    // Clustered incident severity
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },

    // Aggregated AI/NLP confidence score (0 to 1)
    confidence: {
      type: Number,
      min: [0, 'Confidence must be between 0 and 1'],
      max: [1, 'Confidence must be between 0 and 1'],
      default: 0.85
    },

    // GeoJSON Point representation of incident centroid for 2dsphere indexing
    centroid: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Centroid coordinates [longitude, latitude] are required'],
        validate: {
          validator: validateGeoCoordinates,
          message: 'Centroid must be [longitude, latitude] with longitude in [-180, 180] and latitude in [-90, 90]'
        }
      }
    },

    // Nested location object matching frontend contract (src/pages/Map.jsx)
    location: {
      name: {
        type: String,
        default: 'Coastal Incident Zone',
        trim: true
      },
      centroid: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function (v) {
            return !v || validateGeoCoordinates(v);
          },
          message: 'Location centroid must be valid [longitude, latitude]'
        }
      },
      radiusMeters: {
        type: Number,
        default: 1200,
        min: 0
      }
    },

    // Denormalized fields for quick access
    locationName: {
      type: String,
      trim: true
    },

    radiusMeters: {
      type: Number,
      default: 1200,
      min: 0
    },

    // Number of aggregated citizen reports
    reportCount: {
      type: Number,
      default: 1,
      min: 1
    },

    // References or custom IDs of attached reports
    reportIds: [
      {
        type: mongoose.Schema.Types.Mixed,
        ref: 'Report'
      }
    ],

    // Timeline timestamps
    firstReportedAt: {
      type: Date,
      default: Date.now
    },

    lastReportedAt: {
      type: Date,
      default: Date.now
    },

    // Incident lifecycle status
    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active'
    },

    // Human-in-the-loop verification status
    verificationStatus: {
      type: String,
      enum: ['unverified', 'verified', 'false_alarm'],
      default: 'unverified'
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.customId || ret._id.toString();
        // Ensure location subobject matches frontend expectations
        if (!ret.location) ret.location = {};
        if (!ret.location.centroid && ret.centroid?.coordinates) {
          ret.location.centroid = ret.centroid.coordinates;
        }
        if (!ret.location.name && ret.locationName) {
          ret.location.name = ret.locationName;
        }
        if (!ret.location.radiusMeters && ret.radiusMeters) {
          ret.location.radiusMeters = ret.radiusMeters;
        }
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

// Pre-save synchronization hook between centroid and location
incidentSchema.pre('save', function (next) {
  // Sync centroid coordinates to location.centroid
  if (this.centroid && this.centroid.coordinates) {
    if (!this.location) this.location = {};
    this.location.centroid = this.centroid.coordinates;
  } else if (this.location && this.location.centroid) {
    this.centroid = {
      type: 'Point',
      coordinates: this.location.centroid
    };
  }

  // Sync locationName
  if (this.location && this.location.name) {
    this.locationName = this.location.name;
  } else if (this.locationName && this.location) {
    this.location.name = this.locationName;
  }

  // Sync radiusMeters
  if (this.location && this.location.radiusMeters) {
    this.radiusMeters = this.location.radiusMeters;
  } else if (this.radiusMeters && this.location) {
    this.location.radiusMeters = this.radiusMeters;
  }

  next();
});

// Geospatial 2dsphere index for clustering, radius search, and hotspots
incidentSchema.index({ centroid: '2dsphere' });

// Query optimization indexes
incidentSchema.index({ lastReportedAt: -1 });
incidentSchema.index({ hazardType: 1, severity: 1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ verificationStatus: 1 });

const Incident = mongoose.model('Incident', incidentSchema);

module.exports = Incident;
