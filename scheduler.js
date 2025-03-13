// scheduler.js

import cron from 'node-cron';
import supabase from './config/supabase.js';
import { createNotification } from './models/notificationModel.js';
import { resetRFIDByGuest } from './models/rfidModel.js';
import { getAllAdmins } from './models/adminModel.js';

/**
 * startCronJobs()
 *  1) Runs every minute.
 *  2) Checks all rooms with status='occupied'.
 *  3) If current time is near check_out time (exactly 10 min left) -> "stay ending soon" notification.
 *  4) If current time >= check_out time (with a 5 min buffer) -> auto-check-out the guest.
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
      return; // No occupied rooms to check
    }

    const now = new Date();

    for (const room of occupiedRooms) {
      // If no check_out is set, skip
      if (!room.check_out) {
        console.log(`[CRON] Room ${room.room_number} has no check_out time. Skipping...`);
        continue;
      }

      const checkOutTime = new Date(room.check_out);
      const diffMs = checkOutTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      // Log for debugging
      console.log(
        `[CRON] Room ${room.room_number} -> diffMinutes=${diffMinutes}, ` +
          `check_out=${checkOutTime.toISOString()}, now=${now.toISOString()}`
      );

      // A) If exactly 10 minutes from check_out, send "stay ending soon" notification
      if (diffMinutes === 10) {
        await sendStayEndingNotification(room);
      }

      // B) If current time >= check_out => auto-check-out
      //    Add a small buffer (e.g. 5 min) to allow minor clock offsets
      if (diffMinutes <= 0) {
        // If it's slightly behind but within a 5-minute grace period, skip this cycle
        if (diffMinutes > -5) {
          console.log(
            `[CRON] Room ${room.room_number} is past check_out, but within the 5-minute buffer. ` +
              'Skipping auto-check-out this cycle.'
          );
          continue;
        }

        // More than 5 minutes overdue, proceed with auto-check-out
        await autoCheckOutRoom(room);
      }
    }
  });
}

/**
 * Send a "stay ending soon" notification to the guest and *all admins*.
 */
async function sendStayEndingNotification(room) {
  try {
    if (!room.guest_id) {
      console.log(`[CRON] Room ${room.room_number} has no guest_id. Skipping notification.`);
      return;
    }

    // 1) Notify the guest
    await createNotification({
      recipient_guest_id: room.guest_id,
      title: 'Stay Ending Soon',
      message: `Your stay for room ${room.room_number} ends in 10 minutes.`,
      notification_type: 'stay_ending_soon',
    });

    // 2) Notify all admins
    const { data: admins, error: adminErr } = await getAllAdmins();
    if (adminErr || !admins) {
      console.error('[CRON] Error fetching admins for "stay ending soon":', adminErr);
      return;
    }

    for (const admin of admins) {
      await createNotification({
        recipient_admin_id: admin.id,
        title: 'Guest Stay Ending Soon',
        message: `Guest ID ${room.guest_id} in room ${room.room_number} has 10 minutes left.`,
        notification_type: 'stay_ending_soon',
      });
    }

    console.log(`[CRON] Sent "stay ending soon" notifications for room ${room.room_number}`);
  } catch (err) {
    console.error('[CRON] Error sending stay ending notification:', err);
  }
}

/**
 * Automatically check-out a room if time is up:
 *  - room.status -> 'available'
 *  - check_in -> null
 *  - check_out -> null
 *  - hours_stay -> null
 *  - guest_id -> null
 *  - RFID(s) for that guest -> 'available'
 *  - Notifications for both guest & all admins
 *
 *  (Removed `guest_name` references because it no longer exists in the rooms table.)
 */
async function autoCheckOutRoom(room) {
  try {
    console.log(`[CRON] Auto-checking out room ${room.room_number} (ID: ${room.id})...`);

    // 1) Update the room record
    //    - Clear out the guest_id, hours_stay
    //    - Set status back to 'available', check_in & check_out to null
    const { data: updatedRoom, error: roomError } = await supabase
      .from('rooms')
      .update({
        status: 'available',
        check_in: null,
        check_out: null,
        hours_stay: null,
        guest_id: null,
        // Remove guest_name or any column that doesn't exist in your DB
      })
      .eq('id', room.id)
      .single();

    if (roomError) {
      console.error('[CRON] Error auto-checking out room:', roomError);
      return;
    }

    // 2) Reset the RFID(s) for that guest
    if (room.guest_id) {
      await resetRFIDByGuest(room.guest_id);
    }

    // 3) Notify the guest (if there was one assigned)
    if (room.guest_id) {
      await createNotification({
        recipient_guest_id: room.guest_id,
        title: 'Checked Out',
        message: `You have been automatically checked out of room ${room.room_number}.`,
        notification_type: 'auto_checkout',
      });
    }

    // 4) Notify all admins
    const { data: admins, error: adminErr } = await getAllAdmins();
    if (adminErr || !admins) {
      console.error('[CRON] Error fetching admins for auto-checkout:', adminErr);
    } else {
      for (const admin of admins) {
        await createNotification({
          recipient_admin_id: admin.id,
          title: 'Guest Auto-Checked Out',
          message: `Guest ID ${room.guest_id} was auto-checked out from room ${room.room_number}.`,
          notification_type: 'auto_checkout',
        });
      }
    }

    console.log(
      `[CRON] Auto-checked out room ${room.room_number}, set to 'available' and cleared guest data.`
    );
  } catch (err) {
    console.error('[CRON] Error in autoCheckOutRoom:', err);
  }
}
