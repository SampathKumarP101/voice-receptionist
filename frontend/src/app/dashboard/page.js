'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalCalls: 0,
    todayCalls: 0,
  });
  const [recentCalls, setRecentCalls] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Get first clinic (in real app, would be based on logged-in user)
      const { data: clinics } = await supabase
        .from('clinics')
        .select('*')
        .limit(1)
        .single();

      if (!clinics) {
        console.error('No clinic found. Please run database schema.');
        return;
      }

      setClinicId(clinics.id);

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Get appointments stats
      const { data: allAppointments, count: totalCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact' })
        .eq('clinic_id', clinics.id);

      const { data: todayAppts, count: todayCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact' })
        .eq('clinic_id', clinics.id)
        .eq('appointment_date', today);

      // Get call logs stats
      const { data: allCalls, count: callsCount } = await supabase
        .from('call_logs')
        .select('*', { count: 'exact' })
        .eq('clinic_id', clinics.id);

      const { data: todayCalls, count: todayCallsCount } = await supabase
        .from('call_logs')
        .select('*', { count: 'exact' })
        .eq('clinic_id', clinics.id)
        .gte('created_at', new Date(today).toISOString());

      setStats({
        totalAppointments: totalCount || 0,
        todayAppointments: todayCount || 0,
        totalCalls: callsCount || 0,
        todayCalls: todayCallsCount || 0,
      });

      // Get recent calls (last 5)
      const { data: recentCallsData } = await supabase
        .from('call_logs')
        .select('*')
        .eq('clinic_id', clinics.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentCalls(recentCallsData || []);

      // Get upcoming appointments
      const { data: upcomingData } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', clinics.id)
        .eq('status', 'confirmed')
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(5);

      setUpcomingAppointments(upcomingData || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your clinic's voice receptionist activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">📅</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Appointments
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats.totalAppointments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">📆</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Appointments
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats.todayAppointments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">📞</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Calls
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats.totalCalls}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">☎️</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Calls
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats.todayCalls}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Calls */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Calls
            </h3>
            {recentCalls.length === 0 ? (
              <p className="text-gray-500 text-sm">No calls yet. Waiting for first call...</p>
            ) : (
              <div className="space-y-3">
                {recentCalls.map((call) => (
                  <div
                    key={call.id}
                    className="border-l-4 border-primary-500 bg-gray-50 p-3 rounded"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {call.from_number}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(call.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          call.call_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {call.call_status}
                      </span>
                    </div>
                    {call.detected_language && (
                      <p className="text-xs text-gray-600 mt-1">
                        Language: {call.detected_language}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Upcoming Appointments
              </h3>
              <Link
                href="/appointments"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all →
              </Link>
            </div>
            {upcomingAppointments.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No upcoming appointments. Book the first one!
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="border-l-4 border-green-500 bg-gray-50 p-3 rounded"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {apt.patient_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {apt.patient_phone}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          📅 {apt.appointment_date} at {apt.appointment_time}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
