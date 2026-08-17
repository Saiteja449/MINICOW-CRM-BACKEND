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

const jsonFilePath = path.join(__dirname, "sai_leads.json");

const importSaiLeads = async () => {
  try {
    await connectDB();

    const fileContent = fs.readFileSync(jsonFilePath, "utf-8");
    const leadsData = JSON.parse(fileContent);

    if (leadsData.length === 0) {
      console.log("No leads found in the JSON file.");
      process.exit(0);
    }

    let newInserted = 0;
    let updated = 0;

    for (const lead of leadsData) {
      // Robust phone number check
      const phoneDigits = lead.phone.replace(/\D/g, '');
      let basePhone = phoneDigits;
      if (basePhone.length === 12 && basePhone.startsWith('91')) {
        basePhone = basePhone.substring(2);
      } else if (basePhone.length === 11 && basePhone.startsWith('0')) {
        basePhone = basePhone.substring(1);
      }

      const possiblePhones = [
        basePhone,
        `91${basePhone}`,
        `+91${basePhone}`,
        `0${basePhone}`,
        lead.phone
      ];

      const existingLead = await Lead.findOne({ phone: { $in: possiblePhones } });
      
      if (existingLead) {
        await Lead.updateOne({ _id: existingLead._id }, { $set: lead });
        updated++;
      } else {
        await Lead.create(lead);
        newInserted++;
      }
    }

    console.log(`Finished: ${newInserted} new leads inserted, ${updated} duplicate leads updated.`);
    process.exit(0);
  } catch (error) {
    console.error("Error importing leads:", error);
    process.exit(1);
  }
};

importSaiLeads();
