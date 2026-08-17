import Lead from "../models/Lead.js";
import User from "../models/User.js";
import AssignmentState from "../models/AssignmentState.js";

export const receiveCRMLead = async (req, res) => {
  try {
    const { name, phone, email, city, source, notes } = req.body;

    const errors = [];
    if (!name || name.trim() === "") errors.push("Name is required");
    if (!phone || phone.trim() === "") errors.push("Phone number is required");

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Clean phone number
    let cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length > 10 && cleanedPhone.startsWith("91")) {
      cleanedPhone = cleanedPhone.substring(2);
    }
    // Also remove leading zeros if any, based on Indian standard (optional, but sticking to basics)

    const existingLead = await Lead.findOne({ phone: cleanedPhone });
    if (existingLead) {
      return res.status(400).json({
        success: false,
        message: "A lead with this phone number already exists.",
      });
    }

    const leadData = {
      name,
      phone: cleanedPhone,
      email: email || "",
      city: city || "",
      service: "General Enquiry", // Default since it's not in the payload
      notes: notes || "",
      source: source || "Petsfolio CRM",
      status: "New",
      assignedTo: "Unassigned",
      joinedAt: new Date(),
    };

    // Auto-assign lead to next sales person using round-robin
    const reps = await User.find({ role: "sales person" }).sort({ _id: 1 });
    if (reps && reps.length > 0) {
      let state = await AssignmentState.findOne({ key: "leadAssignment" });
      if (!state) {
        state = await AssignmentState.create({
          key: "leadAssignment",
          lastAssignedIndex: -1,
        });
      }

      let nextIndex = state.lastAssignedIndex + 1;
      if (nextIndex >= reps.length) {
        nextIndex = 0;
      }

      leadData.assignedTo = reps[nextIndex].name;
      state.lastAssignedIndex = nextIndex;
      await state.save();
    }

    const lead = await Lead.create(leadData);

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      leadId: lead._id,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
