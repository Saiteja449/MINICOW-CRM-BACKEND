import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import connectDB from "./configs/db.js";
import Lead from "./models/Lead.js";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonFilePath = path.join(__dirname, "old_leads.json");

const importLeads = async () => {
  try {
    await connectDB();

    const fileContent = fs.readFileSync(jsonFilePath, "utf-8");
    const leadsData = JSON.parse(fileContent);

    if (leadsData.length === 0) {
      console.log("No leads found in the JSON file.");
      process.exit(0);
    }

    const insertedLeads = await Lead.insertMany(leadsData);
    console.log(`Successfully imported ${insertedLeads.length} leads.`);

    process.exit(0);
  } catch (error) {
    console.error("Error importing leads:", error);
    process.exit(1);
  }
};

importLeads();
