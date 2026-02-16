import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUser,
  HiArrowDownTray,       // Correct replacement for save icon in Heroicons v2
  HiOutlineXMark,
  HiOutlinePlus,
  HiOutlineMinus
} from 'react-icons/hi2';
import { MdOutlineStraighten } from 'react-icons/md'; // Ruler/measurement icon

import { MEASUREMENT_TYPES, GARMENT_TYPES } from '../../utils/constants';

const MeasurementForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  garmentType = 'shirt',
  readOnly = false
}) => {
  const [measurements, setMeasurements] = useState(initialData || {
    // Upper body measurements
    chest: '',
    waist: '',
    shoulder: '',
    arm_length: '',
    arm_circumference: '',
    neck: '',
    back_width: '',
    front_length: '',
    // Lower body measurements
    hip: '',
    inseam: '',
    outseam: '',
    thigh: '',
    knee: '',
    calf: '',
    ankle: '',
    // Full body measurements
    total_height: '',
    torso_length: '',
    // Additional info
    notes: ''
  });

  const [selectedGarment, setSelectedGarment] = useState(garmentType);
  const [errors, setErrors] = useState({});

  // Get relevant measurements based on garment type
  const getRelevantMeasurements = () => {
    const garment = GARMENT_TYPES.find(g => g.id === selectedGarment);
    if (!garment) return Object.keys(MEASUREMENT_TYPES.UPPER_BODY);

    switch (garment.category) {
      case 'upper':
        return Object.keys(MEASUREMENT_TYPES.UPPER_BODY);
      case 'lower':
        return Object.keys(MEASUREMENT_TYPES.LOWER_BODY);
      case 'full':
        return [
          ...Object.keys(MEASUREMENT_TYPES.UPPER_BODY),
          ...Object.keys(MEASUREMENT_TYPES.LOWER_BODY),
          ...Object.keys(MEASUREMENT_TYPES.FULL_BODY)
        ];
      default:
        return Object.keys(MEASUREMENT_TYPES.UPPER_BODY);
    }
  };

  // Handle input change
  const handleChange = (field, value) => {
    // Only allow numbers and decimal points
    if (value && !/^\d*\.?\d*$/.test(value)) return;

    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate measurements
  const validate = () => {
    const newErrors = {};
    const relevantFields = getRelevantMeasurements();

    relevantFields.forEach(field => {
      if (!measurements[field] || measurements[field] === '') {
        // Only validate required fields (customize as needed)
        const requiredFields = ['chest', 'waist', 'shoulder'];
        if (requiredFields.includes(field)) {
          newErrors[field] = 'This measurement is required';
        }
      } else if (parseFloat(measurements[field]) <= 0) {
        newErrors[field] = 'Value must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      const numericMeasurements = {};
      Object.keys(measurements).forEach(key => {
        if (measurements[key] !== '') {
          numericMeasurements[key] = parseFloat(measurements[key]);
        }
      });

      onSubmit({
        garment_type: selectedGarment,
        measurements: numericMeasurements,
        notes: measurements.notes
      });
    }
  };

  // Quick fill with standard sizes (example values — feel free to adjust)
  const quickFillStandard = (size) => {
    const standardSizes = {
      S: { chest: 36, waist: 30, shoulder: 16, arm_length: 24 },
      M: { chest: 40, waist: 34, shoulder: 18, arm_length: 25 },
      L: { chest: 44, waist: 38, shoulder: 20, arm_length: 26 },
      XL: { chest: 48, waist: 42, shoulder: 22, arm_length: 27 }
    };

    if (standardSizes[size]) {
      setMeasurements(prev => ({
        ...prev,
        ...standardSizes[size]
      }));
    }
  };

  // Render a single measurement input field
  const renderMeasurementInput = (field, label) => (
    <div key={field} className="relative">
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
        {label} <span className="text-gray-400">(cm)</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={measurements[field] || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          disabled={readOnly}
          className={`w-full px-3 py-2.5 bg-white dark:bg-white/5 border ${
            errors[field] ? 'border-red-500' : 'border-gray-200 dark:border-white/10'
          } rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          placeholder="0"
        />
        <MdOutlineStraighten
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={16}
        />
      </div>
      {errors[field] && (
        <p className="text-red-500 text-[10px] mt-1">{errors[field]}</p>
      )}
    </div>
  );

  const relevantMeasurements = getRelevantMeasurements();

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center">
            <MdOutlineStraighten className="text-red-600" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">
              Measurements
            </h3>
            <p className="text-[10px] text-gray-500">Enter customer measurements in centimeters</p>
          </div>
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            {/* Quick Fill Buttons */}
            <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1">
              {['S', 'M', 'L', 'XL'].map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => quickFillStandard(size)}
                  className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-red-600 hover:bg-white dark:hover:bg-white/10 rounded transition-all"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Garment Type Selector */}
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Garment Type
        </label>
        <select
          value={selectedGarment}
          onChange={(e) => setSelectedGarment(e.target.value)}
          disabled={readOnly}
          className="w-full px-3 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all disabled:opacity-50"
        >
          {GARMENT_TYPES.map(garment => (
            <option key={garment.id} value={garment.id}>
              {garment.name}
            </option>
          ))}
        </select>
      </div>

      {/* Measurement Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {relevantMeasurements.map(field => {
          const category = Object.keys(MEASUREMENT_TYPES).find(cat =>
            MEASUREMENT_TYPES[cat]?.[field]
          );
          const label = MEASUREMENT_TYPES[category]?.[field] || field.replace(/_/g, ' ');
          return renderMeasurementInput(field, label);
        })}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
          Additional Notes
        </label>
        <textarea
          value={measurements.notes || ''}
          onChange={(e) => setMeasurements(prev => ({ ...prev, notes: e.target.value }))}
          disabled={readOnly}
          rows={3}
          className="w-full px-3 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all disabled:opacity-50 resize-none"
          placeholder="Any special instructions or notes about the measurements..."
        />
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            <HiArrowDownTray size={16} />
            Save Measurements
          </button>
        </div>
      )}
    </motion.form>
  );
};

export default MeasurementForm;