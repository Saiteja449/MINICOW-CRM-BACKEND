import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./configs/db.js";
import Lead from "./models/Lead.js";
import User from "./models/User.js";
import AssignmentState from "./models/AssignmentState.js";

dotenv.config();

const assignLeads = async () => {
  try {
    await connectDB();
    console.log("Database connected. Finding unassigned leads...");

    const unassignedLeads = await Lead.find({
      $or: [
        { assignedTo: "Unassigned" },
        { assignedTo: { $exists: false } },
        { assignedTo: null },
        { assignedTo: "" }
      ]
    }).sort({ createdAt: 1 });

    if (unassignedLeads.length === 0) {
      console.log("No unassigned leads found.");
      process.exit(0);
    }

    console.log(`Found ${unassignedLeads.length} unassigned leads.`);

    const reps = await User.find({ role: "sales person" }).sort({ _id: 1 });
    if (!reps || reps.length === 0) {
      console.log("No sales persons found. Cannot assign leads.");
      process.exit(1);
    }

    console.log(`Found ${reps.length} sales persons. Proceeding with round-robin assignment...`);

    let state = await AssignmentState.findOne({ key: "leadAssignment" });
    if (!state) {
      state = await AssignmentState.create({
        key: "leadAssignment",
        lastAssignedIndex: -1,
      });
    }

    let assignedCount = 0;
    
    for (const lead of unassignedLeads) {
      let nextIndex = state.lastAssignedIndex + 1;
      if (nextIndex >= reps.length) {
        nextIndex = 0;
      }

      lead.assignedTo = reps[nextIndex].name;
      await lead.save();

      state.lastAssignedIndex = nextIndex;
      await state.save();
      
      console.log(`Assigned lead "${lead.name}" (${lead.phone}) to ${reps[nextIndex].name}`);
      assignedCount++;
    }

    console.log(`\nSuccessfully assigned ${assignedCount} leads.`);
    process.exit(0);
  } catch (error) {
    console.error("Error assigning leads:", error);
    process.exit(1);
  }
};

assignLeads();
