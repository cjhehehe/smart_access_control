import supabase from '../config/supabase.js'; // Correct relative path to supabase.js

async function resetDatabase() {
  console.log("Starting database reset...");

  // 1. access_logs: Remove all data.
  let { error } = await supabase
    .from('access_logs')
    .delete()
    .gt('id', 0);
  if (error) {
    console.error('Error clearing access_logs:', error);
  } else {
    console.log('access_logs cleared.');
  }

  // 2. activity_logs: Remove all data.
  ({ error } = await supabase
    .from('activity_logs')
    .delete()
    .gt('id', 0));
  if (error) {
    console.error('Error clearing activity_logs:', error);
  } else {
    console.log('activity_logs cleared.');
  }

  // 3. admins: Leave intact.
  console.log('admins left intact.');

  // 4. feedback_complaints: Remove all data.
  ({ error } = await supabase
    .from('feedback_complaints')
    .delete()
    .gt('id', 0));
  if (error) {
    console.error('Error clearing feedback_complaints:', error);
  } else {
    console.log('feedback_complaints cleared.');
  }

  // 5. guests: Leave intact.
  console.log('guests left intact.');

  // 6. membership_perks: Leave intact.
  console.log('membership_perks left intact.');

  // 7. notifications: Remove all data.
  ({ error } = await supabase
    .from('notifications')
    .delete()
    .gt('id', 0));
  if (error) {
    console.error('Error clearing notifications:', error);
  } else {
    console.log('notifications cleared.');
  }

  // 8. rfid_tags: Reset rows – set all columns (except id and rfid_uid) to NULL and status to 'available'.
  ({ error } = await supabase
    .from('rfid_tags')
    .update({
      guest_id: null,
      guest_name: null,
      // Reset additional columns as needed.
      status: 'available'
    })
    .gt('id', 0));
  if (error) {
    console.error('Error resetting rfid_tags:', error);
  } else {
    console.log('rfid_tags reset.');
  }

  // 9. rooms: Reset rows – set guest_id, guest_name, hours_stay to NULL and status to 'available'.
  ({ error } = await supabase
    .from('rooms')
    .update({
      guest_id: null,
      guest_name: null,
      hours_stay: null,
      status: 'available'
    })
    .gt('id', 0));
  if (error) {
    console.error('Error resetting rooms:', error);
  } else {
    console.log('rooms reset.');
  }

  // 10. service_requests: Remove all data.
  ({ error } = await supabase
    .from('service_requests')
    .delete()
    .gt('id', 0));
  if (error) {
    console.error('Error clearing service_requests:', error);
  } else {
    console.log('service_requests cleared.');
  }

  // 11. system_settings: Leave intact.
  console.log('system_settings left intact.');

  // 12. mac_addresses: Leave intact.
  console.log('wifi_access left intact.');

  console.log('Database reset completed successfully.');
}

resetDatabase()
  .then(() => {
    console.log('Setup DB script finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error running setup DB script:', err);
    process.exit(1);
  });
