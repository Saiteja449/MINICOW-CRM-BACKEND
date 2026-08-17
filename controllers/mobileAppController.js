import Lead from "../models/Lead.js";
import User from "../models/User.js";
import AssignmentState from "../models/AssignmentState.js";
import { getIO } from "../socket/socket.js";

export const receiveMobileAppLead = async (req, res) => {
  try {
    const { name, phone, email, service } = req.body;

    const errors = [];
    if (!name || name.trim() === "") errors.push("Name is required");
    if (!phone || phone.trim() === "") errors.push("Phone number is required");

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const existingLead = await Lead.findOne({ phone: phone });
    if (existingLead) {
      return res.status(400).json({
        success: false,
        message: "A lead with this phone number already exists.",
      });
    }

    const mapService = (incomingService) => {
      if (!incomingService) return "General Enquiry";
      const s = incomingService.toLowerCase();
      if (s.includes("cow") || s.includes("mini") || s.includes("buy")) return "Miniature Cow Sales";
      return "General Enquiry";
    };

    const leadData = {
      name: name,
      phone: phone,
      email: email || "",
      service: mapService(service),
      source: "Mobile App",
      status: "New",
      assignedTo: "Unassigned",
      joinedAt: new Date(),
    };

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

    const io = getIO();
    if (io) {
      io.emit("new_lead", lead);
    }

    res.status(201).json({
      success: true,
      message: "Lead received successfully from Mobile App.",
      leadId: lead._id,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
