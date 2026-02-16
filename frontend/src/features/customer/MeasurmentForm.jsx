import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HiOutlineClipboardDocumentList, 
  HiOutlineCheck, 
  HiOutlineXMark,
  HiOutlineUser,
  HiOutlineDocumentText
} from 'react-icons/hi2';
import { MEASUREMENT_LABELS, SUIT_TYPE_LABELS } from '../../utils/constants';

const MeasurementForm = ({ 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  suitTypes = [],
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    // Customer Info
    customer_name: initialData.customer_name || '',
    customer_phone: initialData.customer_phone || '',
    customer_email: initialData.customer_email || '',
    
    // Order Info
    suit_type: initialData.suit_type || 'two_piece',
    notes: initialData.notes || '',
    special_requests: initialData.special_requests || '',
    
    // Measurements (in inches/cm)
    chest: initialData.chest || '',
    waist: initialData.waist || '',
    hips: initialData.hips || '',
    shoulder: initialData.shoulder || '',
    sleeve_length: initialData.sleeve_length || '',
    jacket_length: initialData.jacket_length || '',
    inseam: initialData.inseam || '',
    outseam: initialData.outseam || '',
    neck: initialData.neck || '',
    bicep: initialData.bicep || '',
    wrist: initialData.wrist || '',
    
    // Additional fit preferences
    fit_preference: initialData.fit_preference || 'regular', // slim, regular, relaxed
    fabric_preference: initialData.fabric_preference || '',
    color_preference: initialData.color_preference || '',
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }
    
    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = 'Phone number is required';
    }
    
    // Validate measurements are numbers if provided
    const measurementFields = [
      'chest', 'waist', 'hips', 'shoulder', 'sleeve_length',
      'jacket_length', 'inseam', 'outseam', 'neck', 'bicep', 'wrist'
    ];
    
    measurementFields.forEach(field => {
      if (formData[field] && isNaN(parseFloat(formData[field]))) {
        newErrors[field] = 'Must be a valid number';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Convert measurement strings to numbers
      const processedData = { ...formData };
      const measurementFields = [
        'chest', 'waist', 'hips', 'shoulder', 'sleeve_length',
        'jacket_length', 'inseam', 'outseam', 'neck', 'bicep', 'wrist'
      ];
      
      measurementFields.forEach(field => {
        if (processedData[field]) {
          processedData[field] = parseFloat(processedData[field]);
        }
      });
      
      onSubmit?.(processedData);
    }
  };

  const inputClass = (fieldName) => `
    w-full bg-white/5 border ${errors[fieldName] ? 'border-red-500' : 'border-white/10'} 
    rounded-lg px-4 py-3 text-white text-sm font-medium
    focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500
    placeholder:text-gray-500 transition-all
  `;

  const labelClass = "block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2";

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* Customer Information Section */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <HiOutlineUser className="text-red-500" size={20} />
          <h3 className="text-white font-bold uppercase tracking-wider text-sm">
            Customer Information
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Customer Name *</label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleInputChange}
              placeholder="Enter customer name"
              className={inputClass('customer_name')}
            />
            {errors.customer_name && (
              <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>
            )}
          </div>
          
          <div>
            <label className={labelClass}>Phone Number *</label>
            <input
              type="tel"
              name="customer_phone"
              value={formData.customer_phone}
              onChange={handleInputChange}
              placeholder="+251 9XX XXX XXX"
              className={inputClass('customer_phone')}
            />
            {errors.customer_phone && (
              <p className="text-red-500 text-xs mt-1">{errors.customer_phone}</p>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className={labelClass}>Email (Optional)</label>
            <input
              type="email"
              name="customer_email"
              value={formData.customer_email}
              onChange={handleInputChange}
              placeholder="customer@email.com"
              className={inputClass('customer_email')}
            />
          </div>
        </div>
      </div>

      {/* Order Details Section */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <HiOutlineClipboardDocumentList className="text-red-500" size={20} />
          <h3 className="text-white font-bold uppercase tracking-wider text-sm">
            Order Details
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Suit Type</label>
            <select
              name="suit_type"
              value={formData.suit_type}
              onChange={handleInputChange}
              className={inputClass('suit_type')}
            >
              {Object.entries(SUIT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value} className="bg-gray-900">
                  {label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className={labelClass}>Fit Preference</label>
            <select
              name="fit_preference"
              value={formData.fit_preference}
              onChange={handleInputChange}
              className={inputClass('fit_preference')}
            >
              <option value="slim" className="bg-gray-900">Slim Fit</option>
              <option value="regular" className="bg-gray-900">Regular Fit</option>
              <option value="relaxed" className="bg-gray-900">Relaxed Fit</option>
            </select>
          </div>
          
          <div>
            <label className={labelClass}>Fabric Preference</label>
            <input
              type="text"
              name="fabric_preference"
              value={formData.fabric_preference}
              onChange={handleInputChange}
              placeholder="e.g., Wool, Cotton, Linen"
              className={inputClass('fabric_preference')}
            />
          </div>
          
          <div>
            <label className={labelClass}>Color Preference</label>
            <input
              type="text"
              name="color_preference"
              value={formData.color_preference}
              onChange={handleInputChange}
              placeholder="e.g., Navy Blue, Charcoal"
              className={inputClass('color_preference')}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className={labelClass}>Special Requests</label>
            <textarea
              name="special_requests"
              value={formData.special_requests}
              onChange={handleInputChange}
              placeholder="Any special requests or customizations..."
              rows={2}
              className={inputClass('special_requests')}
            />
          </div>
        </div>
      </div>

      {/* Measurements Section */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <HiOutlineDocumentText className="text-red-500" size={20} />
          <h3 className="text-white font-bold uppercase tracking-wider text-sm">
            Measurements (in inches)
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(MEASUREMENT_LABELS).map(([key, label]) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <input
                type="number"
                step="0.25"
                name={key}
                value={formData[key]}
                onChange={handleInputChange}
                placeholder="0.00"
                className={inputClass(key)}
              />
              {errors[key] && (
                <p className="text-red-500 text-xs mt-1">{errors[key]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <label className={labelClass}>Additional Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Any additional notes about the order..."
          rows={3}
          className={inputClass('notes')}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <motion.button
            type="button"
            onClick={onCancel}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-xs rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <HiOutlineXMark size={16} />
            Cancel
          </motion.button>
        )}
        
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          className={`
            px-8 py-3 bg-red-600 text-white font-bold uppercase tracking-wider text-xs rounded-lg
            flex items-center gap-2 transition-all
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}
          `}
        >
          {loading ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <>
              <HiOutlineCheck size={16} />
              Save Measurements
            </>
          )}
        </motion.button>
      </div>
    </motion.form>
  );
};

export default MeasurementForm;
