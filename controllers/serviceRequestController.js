import supabase from '../config/supabase.js';
import { createServiceRequest, getServiceRequestsByGuest } from '../models/serviceRequestModel.js';

/**
 * Submit a service request (Optimized)
 */
export const submitServiceRequest = async (req, res) => {
    try {
        const { guest_id, service_type, description, preferred_time } = req.body;

        if (!guest_id || !service_type || !description || !preferred_time) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Fetch guest and check for duplicate requests concurrently
        const [{ data: guest, error: guestError }, { data: existingRequest }] = await Promise.all([
            supabase.from('guests').select('id').eq('id', guest_id).maybeSingle(),
            supabase
                .from('service_requests')
                .select('id')
                .eq('guest_id', guest_id)
                .eq('service_type', service_type)
                .eq('status', 'pending')
                .maybeSingle(), // Prevents duplicate requests
        ]);

        if (guestError || !guest) {
            return res.status(404).json({ message: 'Guest not found' });
        }

        if (existingRequest) {
            return res.status(400).json({ message: 'A similar pending service request already exists' });
        }

        // Insert the service request
        const { data, error } = await createServiceRequest({
            guest_id,
            service_type,
            description,
            preferred_time,
            status: 'pending',
        });

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ message: 'Database error: Unable to submit service request', error: error.message });
        }

        res.status(201).json({ message: 'Service request submitted successfully', data });
    } catch (error) {
        console.error('Unexpected Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Fetch service requests by guest ID (Optimized)
 */
export const getServiceRequests = async (req, res) => {
    try {
        const { guest_id } = req.params;
        const { limit = 10, offset = 0 } = req.query; // Pagination support

        if (!guest_id) {
            return res.status(400).json({ message: 'Guest ID is required' });
        }

        // Retrieve service requests with pagination
        const { data, error } = await getServiceRequestsByGuest(guest_id, parseInt(limit), parseInt(offset));

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ message: 'Database error: Unable to fetch service requests', error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'No service requests found for this guest' });
        }

        res.status(200).json({ message: 'Service requests fetched successfully', data });
    } catch (error) {
        console.error('Unexpected Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
