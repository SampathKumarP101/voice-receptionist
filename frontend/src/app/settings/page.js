'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Settings() {
  const [clinic, setClinic] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);

      // Get first clinic
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('*')
        .limit(1)
        .single();

      if (!clinicData) return;

      setClinic(clinicData);

      // Get availability slots
      const { data: availData } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('clinic_id', clinicData.id)
        .order('day_of_week', { ascending: true });

      setAvailability(availData || []);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleClinicUpdate(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('clinics')
        .update({
          name: clinic.name,
          email: clinic.email,
          phone: clinic.phone,
          address: clinic.address,
          language_preference: clinic.language_preference,
        })
        .eq('id', clinic.id);

      if (error) throw error;

      alert('Clinic settings updated successfully!');
    } catch (error) {
      console.error('Error updating clinic:', error);
      alert('Failed to update clinic settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvailabilityToggle(slotId, isActive) {
    try {
      const { error } = await supabase
        .from('availability_slots')
        .update({ is_active: !isActive })
        .eq('id', slotId);

      if (error) throw error;

      // Reload availability
      loadSettings();
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          No clinic found. Please run the database schema first.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your clinic information and availability
        </p>
      </div>

      {/* Clinic Information */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Clinic Information
          </h3>
          <form onSubmit={handleClinicUpdate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  required
                  value={clinic.name || ''}
                  onChange={(e) =>
                    setClinic({ ...clinic, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={clinic.phone || ''}
                  onChange={(e) =>
                    setClinic({ ...clinic, phone: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={clinic.email || ''}
                  onChange={(e) =>
                    setClinic({ ...clinic, email: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Language Preference
                </label>
                <select
                  value={clinic.language_preference || 'kn-IN'}
                  onChange={(e) =>
                    setClinic({
                      ...clinic,
                      language_preference: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
                  <option value="en-IN">English</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                value={clinic.address || ''}
                onChange={(e) =>
                  setClinic({ ...clinic, address: e.target.value })
                }
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Availability Schedule */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Availability Schedule
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Configure your clinic's working hours for each day of the week
          </p>

          {availability.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                No availability slots configured yet.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Availability slots are created when you run the database schema.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {daysOfWeek.map((day) => {
                const daySlots = availability.filter(
                  (slot) => slot.day_of_week === day.value
                );

                return (
                  <div
                    key={day.value}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {day.label}
                        </h4>
                        {daySlots.length > 0 ? (
                          <div className="mt-2 space-y-1">
                            {daySlots.map((slot) => (
                              <div
                                key={slot.id}
                                className="flex items-center justify-between"
                              >
                                <p className="text-sm text-gray-600">
                                  {slot.start_time} - {slot.end_time}{' '}
                                  <span className="text-xs text-gray-500">
                                    ({slot.slot_duration_minutes} min slots)
                                  </span>
                                </p>
                                <button
                                  onClick={() =>
                                    handleAvailabilityToggle(
                                      slot.id,
                                      slot.is_active
                                    )
                                  }
                                  className={`ml-4 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                                    slot.is_active
                                      ? 'bg-primary-600'
                                      : 'bg-gray-200'
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                                      slot.is_active
                                        ? 'translate-x-5'
                                        : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">Closed</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  About Availability
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    The AI receptionist will only book appointments during active
                    hours. Toggle switches to enable/disable specific days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exotel Configuration */}
      <div className="bg-white shadow rounded-lg mt-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Voice Integration (Exotel)
          </h3>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Exotel credentials are configured in the backend{' '}
                  <code className="bg-yellow-100 px-1 py-0.5 rounded">.env</code>{' '}
                  file. See{' '}
                  <code className="bg-yellow-100 px-1 py-0.5 rounded">
                    EXOTEL_SETUP.md
                  </code>{' '}
                  for setup instructions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
