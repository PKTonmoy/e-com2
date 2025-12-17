import mongoose from 'mongoose';

const courierTariffSchema = new mongoose.Schema(
  {
    courier: { type: String, default: 'steadfast' },
    originDistrict: { type: String, required: true }, // e.g. 'Rajshahi'
    destinationDistrict: { type: String, required: true }, // e.g. 'Nilphamari'
    serviceType: { type: String, default: 'regular' },
    category: { type: String, default: 'regular' },
    baseWeightKg: { type: Number, default: 0.5 },
    maxWeightKg: { type: Number, default: 1 },
    price: { type: Number, required: true }, // in BDT
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

courierTariffSchema.index(
  { courier: 1, originDistrict: 1, destinationDistrict: 1, serviceType: 1, category: 1 },
  { unique: false }
);

const CourierTariff = mongoose.model('CourierTariff', courierTariffSchema);
export default CourierTariff;


