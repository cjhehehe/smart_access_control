// scheduler.js

import cron from 'node-cron';
import supabase from './config/supabase.js';
import { createNotification } from './models/notificationModel.js';
import { resetRFIDByGuest } from './models/rfidModel.js';

/**
 * startCronJobs()
 *  1) Runs every minute.
 *  2) Checks all rooms with status='occupied'.
 *  3) If current time is near check_out time (e.g. 10 min left) -> send "nearly ended" notification.
 *  4) If current time >= check_out time -> auto-check-out the guest.
 * 
 * For a production system, you might:
 *  - Add logic to avoid spamming "10 minutes left" repeatedly.
 *  - Possibly store a "warning_sent" boolean in the rooms table or a separate table.
 */
export function startCronJobs() {
  // The cron expression "* * * * *" => runs every minute
  cron.schedule('* * * * *', async () => {
    console.log('[CRON] Running check for expiring stays...');

    // 1) Fetch all occupied rooms
    const { data: occupiedRooms, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'occupied');

    if (error) {
      console.error('[CRON] Error fetching occupied rooms:', error);
      return;
    }
    if (!occupiedRooms || occupiedRooms.length === 0) {
      // No occupied rooms to check
      return;
    }

    // 2) For each occupied room, check if we are near or past check_out time
    const now = new Date();

    for (const room of occupiedRooms) {
      // If no check_out is set, skip
      if (!room.check_out) continue;

      const checkOutTime = new Date(room.check_out);
      const diffMs = checkOutTime - now;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      // A) If we're exactly 10 minutes from check_out, send "nearly ended" notification
      //    (In production, you might store a "warning_sent" boolean to avoid duplicates.)
      if (diffMinutes === 10) {
        await sendStayEndingNotification(room);
      }

      // B) If current time >= check_out => auto-check-out
      if (now >= checkOutTime) {
        await autoCheckOutRoom(room);
      }
    }
  });
}

/**
 * Send a "stay ending soon" notification to both the guest and the admin (if desired).
 * Adjust logic as needed for your multi-admin or multi-guest scenario.
 */
async function sendStayEndingNotification(room) {
  try {
    if (!room.guest_id) return; // No guest assigned, skip

    // 1) Notify the guest
    await createNotification({
      recipient_guest_id: room.guest_id,
      title: 'Stay Ending Soon',
      message: `Your stay for room ${room.room_number} ends in 10 minutes.`,
      notification_type: 'stay_ending_soon',
    });

    // 2) Notify an admin (if you have multiple admins, adapt accordingly)
    await createNotification({
      recipient_admin_id: 1, // or your actual admin ID
      title: 'Guest Stay Ending Soon',
      message: `Guest ID ${room.guest_id} in room ${room.room_number} has 10 minutes left.`,
      notification_type: 'stay_ending_soon',
    });

    console.log(`[CRON] Sent "stay ending soon" notification for room ${room.room_number}`);
  } catch (err) {
    console.error('[CRON] Error sending stay ending notification:', err);
  }
}

/**
 * Automatically check-out a room:
 *  - room.status -> 'available'
 *  - check_in -> null
 *  - check_out -> null
 *  - RFID(s) for that guest -> 'available'
 *  - Notifications for both guest & admin
 */
async function autoCheckOutRoom(room) {
  try {
    // 1) Update the room record
    const { data: updatedRoom, error: roomError } = await supabase
      .from('rooms')
      .update({
        status: 'available',
        check_in: null,
        check_out: null,
      })
      .eq('id', room.id)
      .single();

    if (roomError) {
      console.error('[CRON] Error auto-checking out room:', roomError);
      return;
    }

    // 2) Reset the RFID(s) for the occupant
    if (room.guest_id) {
      await resetRFIDByGuest(room.guest_id);
    }

    // 3) Create notifications for both guest & admin
    if (room.guest_id) {
      // A) Guest notification
      await createNotification({
        recipient_guest_id: room.guest_id,
        title: 'Checked Out',
        message: `You have been automatically checked out of room ${room.room_number}.`,
        notification_type: 'auto_checkout',
      });

      // B) Admin notification
      await createNotification({
        recipient_admin_id: 1, // or your actual admin ID
        title: 'Guest Auto-Checked Out',
        message: `Guest ID ${room.guest_id} was auto-checked out from room ${room.room_number}.`,
        notification_type: 'auto_checkout',
      });
    }

    console.log(`[CRON] Auto-checked out room ${room.room_number}, set to 'available'.`);
  } catch (err) {
    console.error('[CRON] Error in autoCheckOutRoom:', err);
  }
}
