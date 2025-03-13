// controllers/serviceRequestController.js
import supabase from '../config/supabase.js';
import {
  createServiceRequest,
  getServiceRequestsByGuest
} from '../models/serviceRequestModel.js';
import { createNotification } from '../models/notificationModel.js';

// Import the function to save logs in activity_logs
import { saveActivityLog } from '../models/activityLogModel.js';

export const submitServiceRequest = async (req, res) => {
  try {
    const { guest_id, guest_name, service_type, description, preferred_time } = req.body;

    // Validate request data
    if (!guest_id || !guest_name || !service_type || !description || !preferred_time) {
      return res.status(400).json({
        message: 'All fields are required: guest_id, guest_name, service_type, description, preferred_time'
      });
    }

    // 1) Verify the guest exists
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id')
      .eq('id', guest_id)
      .maybeSingle();

    if (guestError) {
      console.error('Error checking guest existence:', guestError);
      return res.status(500).json({ message: 'Error checking guest', error: guestError.message });
    }
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // 2) Insert the new service request
    const { data, error } = await createServiceRequest({
      guest_id,
      guest_name,
      service_type,
      description,
      preferred_time,
      status: 'pending',
    });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        message: 'Database error: Unable to submit service request',
        error: error.message
      });
    }

    // 'data' now contains the newly created service request row
    const newRequestId = data.id; // e.g. the primary key in service_requests

    // 3) Immediately log this "request_created" event in activity_logs
    if (newRequestId) {
      const logType = "request_created";
      const logMessage = `Guest #${guest_id} created a ${service_type} request.`;

      const { data: logData, error: logError } = await saveActivityLog({
        request_id: newRequestId,
        guest_id,
        log_type: logType,
        log_message: logMessage,
      });

      if (logError) {
        console.error('Error saving service request log:', logError);
        // We won't fail the entire request, just log the error
      }
    }

    // 4) Notify ALL admins about the new request (optional)
    try {
      const { data: allAdmins, error: adminsError } = await supabase
        .from('admins')
        .select('id');

      if (adminsError) {
        console.error('Error fetching admins for notification:', adminsError);
      } else if (allAdmins && allAdmins.length > 0) {
        for (const admin of allAdmins) {
          const adminId = admin.id;
          const notifTitle = 'New Service Request';
          const notifMessage = `Guest #${guest_id} submitted a ${service_type} request.`;

          const { error: notifError } = await createNotification({
            recipient_admin_id: adminId,
            title: notifTitle,
            message: notifMessage,
            notification_type: 'service_request',
          });

          if (notifError) {
            console.error(`Failed to notify admin ${adminId}:`, notifError);
          }
        }
      }
    } catch (notifCatchErr) {
      console.error('Unexpected error creating admin notifications:', notifCatchErr);
    }

    // 5) Return success with the newly created request row
    return res.status(201).json({
      message: 'Service request submitted successfully',
      data
    });
  } catch (error) {
    console.error('Unexpected Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateServiceRequestStatus = async (req, res) => {
  try {
    const { request_id } = req.params;
    const { status } = req.body;

    if (!request_id || !status) {
      return res.status(400).json({
        message: 'Missing request_id or status in request.'
      });
    }

    // Convert request_id to integer
    const reqIdNum = parseInt(request_id, 10);
    if (isNaN(reqIdNum)) {
      return res.status(400).json({ message: 'Invalid request_id format.' });
    }

    // 1) Update the row in service_requests
    const { data: updatedData, error: updateError } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', reqIdNum)
      .select(`
        id,
        guest_id,
        guest_name,
        service_type,
        status
      `)
      .single();

    if (updateError) {
      console.error('Error updating service request status:', updateError);
      return res.status(500).json({
        message: 'Database error: Unable to update status',
        error: updateError.message
      });
    }
    if (!updatedData) {
      return res.status(404).json({
        message: 'Service request not found.'
      });
    }

    // 2) Optionally log this status change in activity_logs
    try {
      const { id: updatedRequestId, guest_id: guestId, service_type: stype, status: newStatus } = updatedData;

      let statusLabel = 'Pending';
      if (newStatus === 'in_progress') statusLabel = 'In Progress';
      else if (newStatus === 'completed') statusLabel = 'Completed';
      else if (newStatus === 'canceled') statusLabel = 'Canceled';

      const { error: logError } = await saveActivityLog({
        request_id: updatedRequestId,
        guest_id: guestId,
        log_type: "status_change",
        log_message: `Status changed to ${statusLabel}.`,
      });
      if (logError) {
        console.error('Error saving status_change log:', logError);
      }
    } catch (logCatchErr) {
      console.error('Unexpected error logging status change:', logCatchErr);
    }

    // 3) Notify the guest about the new status
    try {
      const guestId = updatedData.guest_id;
      const serviceType = updatedData.service_type || 'service request';
      const newStatus = updatedData.status;

      // Convert DB status to a user-friendly label
      let statusLabel = 'Pending';
      if (newStatus === 'in_progress') statusLabel = 'In Progress';
      else if (newStatus === 'completed') statusLabel = 'Completed';
      else if (newStatus === 'canceled') statusLabel = 'Canceled';

      const notifTitle = 'Service Request Updated';
      const notifMessage = `Your ${serviceType} request is now ${statusLabel}.`;

      const { error: notifError } = await createNotification({
        recipient_guest_id: guestId,
        title: notifTitle,
        message: notifMessage,
        notification_type: 'service_request'
      });

      if (notifError) {
        console.error('Failed to create guest notification:', notifError);
      }
    } catch (notifCatchErr) {
      console.error('Unexpected error notifying guest about status change:', notifCatchErr);
    }

    return res.status(200).json({
      message: `Service request #${request_id} status updated to ${status}.`,
      data: updatedData
    });
  } catch (err) {
    console.error('Unexpected Error in updateServiceRequestStatus:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getServiceRequests = async (req, res) => {
  try {
    const { guest_id } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!guest_id) {
      return res.status(400).json({ message: 'Guest ID is required' });
    }

    const { data, error } = await getServiceRequestsByGuest(
      guest_id,
      parseInt(limit),
      parseInt(offset)
    );

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        message: 'Database error: Unable to fetch service requests',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No service requests found for this guest' });
    }

    return res.status(200).json({
      message: 'Service requests fetched successfully',
      data
    });
  } catch (error) {
    console.error('Unexpected Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
