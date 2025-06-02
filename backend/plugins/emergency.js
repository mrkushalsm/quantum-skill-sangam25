module.exports = function emergencyPlugin(schema) {
  schema.add({
    emergencyProfile: {
      bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
      allergies: [String],
      medicalConditions: [String],
      emergencyContacts: [{
        name: String,
        relationship: String,
        phone: String,
        isPrimary: Boolean
      }]
    }
  });

  schema.methods.declareEmergency = function(type, location) {
    return {
      userId: this._id,
      type,
      location,
      timestamp: new Date()
    };
  };
};
