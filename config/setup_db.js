import supabase from '../config/supabase.js'; // Ensure this path is correct for your setup

/**
 * resetDatabase()
 * 
 * Clears or resets specific tables/columns to an initial state:
 *  - Removes data from certain tables (e.g. access_logs, activity_logs, etc.)
 *  - Leaves some tables intact (e.g. admins, guests, membership_perks)
 *  - Resets 'rooms' to status='available' with null guest_id, guest_name, hours_stay,
 *    registration_time, check_in, and check_out
 *  - Resets 'rfid_tags' to status='available' with null guest_id, guest_name
 * 
 * This script is intended for development/QA environments. Use caution if 
 * running against a production database, as it will destroy data.
 */
async function resetDatabase() {
  console.log('[SETUP] Starting database reset...');

  // 1) access_logs: Remove all data
  let { error } = await supabase
    .from('access_logs')
    .delete()
    .gt('id', 0);
  if (error) {
    console.error('[SETUP] Error clearing access_logs:', error);
  } else {
    console.log('[SETUP] access_logs cleared.');
  }

  // 2) activity_logs: Remove all data
  ({ error } = await supabase
    .from('activity_logs')
    .delete()
    .gt('id', 0));
  if (error) {
    console.error('[SETUP] Error clearing activity_logs:', error);
  } else {
    console.log('[SETUP] activity_logs cleared.');
  }

  // 3) admins: Leave intact
  console.log('[SETUP] admins left intact.');

  // 4) feedback_complaints: Remove all data
  ({ error } = await supabase
    .from('feedback_complaints')
    .delete()
    .gt('id', 0));
  if (error) {
    console.error('[SETUP] Error clearing feedback_complaints:', error);
  } else {
    console.log('[SETUP] feedback_complaints cleared.');
  }

  // 5) guests: Leave intact
  console.log('[SETUP] guests left intact.');

  // 6) membership_perks: Leave intact
  console.log('[SETUP] membership_perks left intact.');

  // 7) notifications: Remove all data
  ({ error } = await supabase
    .from('notifications')
    .delete()
    .gt('id', 0));
  if (error) {
    console.error('[SETUP] Error clearing notifications:', error);
  } else {
    console.log('[SETUP] notifications cleared.');
  }

  // 8) rfid_tags: Reset rows -> set columns to null as needed, status='available'
  ({ error } = await supabase
    .from('rfid_tags')
    .update({
      guest_id: null,
      guest_name: null,
      status: 'available'
    })
    .gt('id', 0));
  if (error) {
    console.error('[SETUP] Error resetting rfid_tags:', error);
  } else {
    console.log('[SETUP] rfid_tags reset.');
  }

  // 9) rooms: Reset rows -> set guest_id, guest_name, hours_stay, registration_time, check_in, check_out to null, status='available'
  ({ error } = await supabase
    .from('rooms')
    .update({
      guest_id: null,
      guest_name: null,
      hours_stay: null,
      registration_time: null,
      check_in: null,
      check_out: null,
      status: 'available'
    })
    .gt('id', 0));
  if (error) {
    console.error('[SETUP] Error resetting rooms:', error);
  } else {
    console.log('[SETUP] rooms reset.');
  }

  // 10) service_requests: Remove all data
  ({ error } = await supabase
    .from('service_requests')
    .delete()
    .gt('id', 0));
  if (error) {
    console.error('[SETUP] Error clearing service_requests:', error);
  } else {
    console.log('[SETUP] service_requests cleared.');
  }

  // 11) system_settings: Leave intact
  console.log('[SETUP] system_settings left intact.');

  // 12) mac_addresses: Leave intact
  console.log('[SETUP] mac_addresses left intact.');

  console.log('[SETUP] Database reset completed successfully.');
}

resetDatabase()
  .then(() => {
    console.log('[SETUP] Setup DB script finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[SETUP] Error running setup DB script:', err);
    process.exit(1);
  });
