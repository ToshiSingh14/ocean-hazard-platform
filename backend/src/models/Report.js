const mongoose = require('mongoose');

/**
 * Validates GeoJSON [longitude, latitude] coordinates.
 * In GeoJSON, longitude must precede latitude.
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

const reportSchema = new mongoose.Schema(
  {
    // Unique identifier for contracts and mocks (e.g. "RPT-00201")
    customId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true
    },

    // Citizen or ingest report text
    text: {
      type: String,
      required: [true, 'Report description text is required'],
      trim: true
    },

    // Optional photo URL
    photoUrl: {
      type: String,
      default: null,
      trim: true
    },

    // Geospatial GeoJSON Point representation with additional contract metadata
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude] GeoJSON format
        required: [true, 'Location coordinates [longitude, latitude] are required'],
        validate: {
          validator: validateGeoCoordinates,
          message: 'Coordinates must be [longitude, latitude] with longitude in [-180, 180] and latitude in [-90, 90]'
        }
      },
      name: {
        type: String,
        default: 'Coastal Location',
        trim: true
      },
      raw: {
        type: String,
        default: '',
        trim: true
      },
      source: {
        type: String,
        enum: ['extracted', 'gps', 'manual'],
        default: 'extracted'
      }
    },

    // Denormalized location name for legacy and quick queries
    locationName: {
      type: String,
      trim: true
    },

    // Structured NLP / Threat Intelligence classification
    hazard: {
      type: {
        type: String,
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
      secondaryTypes: {
        type: [String],
        default: []
      },
      confidence: {
        type: Number,
        min: [0, 'Confidence must be at least 0'],
        max: [1, 'Confidence cannot exceed 1'],
        default: 0.85
      }
    },

    // Direct hazardType field for compatibility with Section 7 DB design
    hazardType: {
      type: String,
      enum: [
        'coastal_flooding',
        'abnormal_waves',
        'storm_surge',
        'coastal_erosion',
        'marine_incident',
        'none/low-signal',
        'other'
      ]
    },

    secondaryHazardTypes: {
      type: [String],
      default: []
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1
    },

    // Hazard severity level
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },

    // Associated clustered Incident ID or reference
    incidentId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Incident',
      default: null,
      index: true
    },

    // Moderation and verification status
    status: {
      type: String,
      enum: ['unverified', 'verified', 'false_alarm', 'resolved'],
      default: 'unverified'
    },

    // Ingestion source
    source: {
      type: String,
      enum: ['citizen', 'synthetic', 'news', 'agency'],
      default: 'citizen'
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.customId || ret._id.toString();
        // Ensure consistent contract shape
        if (!ret.locationName && ret.location?.name) {
          ret.locationName = ret.location.name;
        }
        if (!ret.hazardType && ret.hazard?.type) {
          ret.hazardType = ret.hazard.type;
        }
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

// Pre-save synchronization hook between contract representations
reportSchema.pre('save', function (next) {
  // Sync locationName
  if (this.location && this.location.name) {
    this.locationName = this.location.name;
  } else if (this.locationName && this.location) {
    this.location.name = this.locationName;
  }

  // Sync hazard and hazardType
  if (this.hazard && this.hazard.type) {
    this.hazardType = this.hazard.type;
    this.secondaryHazardTypes = this.hazard.secondaryTypes || [];
    this.confidence = this.hazard.confidence;
  } else if (this.hazardType) {
    if (!this.hazard) this.hazard = {};
    this.hazard.type = this.hazardType;
    this.hazard.secondaryTypes = this.secondaryHazardTypes || [];
    this.hazard.confidence = this.confidence !== undefined ? this.confidence : 0.85;
  }

  next();
});

// Geospatial 2dsphere index for proximity and radius queries
reportSchema.index({ location: '2dsphere' });

// Additional indexing for sorting and filtered queries
reportSchema.index({ createdAt: -1 });
reportSchema.index({ 'hazard.type': 1, severity: 1 });
reportSchema.index({ severity: 1 });
reportSchema.index({ status: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
