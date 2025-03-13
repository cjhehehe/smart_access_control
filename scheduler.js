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
 *  3) If exactly 10 minutes before check_out, sends "stay ending soon" notifications.
 *  4) If now >= check_out, auto-checks out the room.
 */
export function startCronJobs() {
  cron.schedule('* * * * *', async () => {
    console.log('[CRON] Running check for expiring stays...');

    // 1) Fetch all occupied rooms.
    const { data: occupiedRooms, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'occupied');

    if (error) {
      console.error('[CRON] Error fetching occupied rooms:', error);
      return;
    }
    if (!occupiedRooms || occupiedRooms.length === 0) {
      return; // Nothing to do.
    }

    const now = new Date();
    for (const room of occupiedRooms) {
      if (!room.check_out) {
        console.log(`[CRON] Room ${room.room_number} has no check_out time. Skipping...`);
        continue;
      }

      const checkOutTime = new Date(room.check_out);
      const diffMinutes = (checkOutTime - now) / (1000 * 60);

      console.log(
        `[CRON] Room ${room.room_number} -> diffMinutes=${diffMinutes.toFixed(2)}, check_out=${checkOutTime.toISOString()}, now=${now.toISOString()}`
      );

      // A) Send "Stay Ending Soon" notifications when diff is within ±30 seconds of 10 minutes.
      if (Math.abs(diffMinutes - 10) < 0.5) {
        await sendStayEndingNotification(room);
      }

      // B) Auto-checkout if current time is at or past the check_out time.
      if (now >= checkOutTime) {
        await autoCheckOutRoom(room);
      }
    }
  });
}

/**
 * Send a "Stay Ending Soon" notification to the guest and all admins.
 */
async function sendStayEndingNotification(room) {
  try {
    if (!room.guest_id) {
      console.log(`[CRON] Room ${room.room_number} has no guest_id. Skipping notification.`);
      return;
    }

    await createNotification({
      recipient_guest_id: room.guest_id,
      title: 'Stay Ending Soon',
      message: `Your stay for room ${room.room_number} ends in 10 minutes.`,
      notification_type: 'stay_ending_soon',
    });

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
 * Auto-checkout a room: updates room status to "available", clears guest data,
 * resets the associated RFID, and sends notifications.
 */
async function autoCheckOutRoom(room) {
  try {
    console.log(`[CRON] Auto-checking out room ${room.room_number} (ID: ${room.id})...`);

    // 1) Update the room record.
    const { data: updatedRoom, error: roomError } = await supabase
      .from('rooms')
      .update({
        status: 'available',
        check_in: null,
        check_out: null,
        hours_stay: null,
        guest_id: null,
      })
      .eq('id', room.id)
      .single();
    if (roomError) {
      console.error('[CRON] Error auto-checking out room:', roomError);
      return;
    }

    // 2) Reset any RFID associated with the guest.
    if (room.guest_id) {
      await resetRFIDByGuest(room.guest_id);
    }

    // 3) Notify the guest.
    if (room.guest_id) {
      await createNotification({
        recipient_guest_id: room.guest_id,
        title: 'Checked Out',
        message: `You have been automatically checked out of room ${room.room_number}.`,
        notification_type: 'auto_checkout',
      });
    }

    // 4) Notify all admins.
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
    console.log(`[CRON] Auto-checked out room ${room.room_number}, cleared guest data.`);
  } catch (err) {
    console.error('[CRON] Error in autoCheckOutRoom:', err);
  }
}
