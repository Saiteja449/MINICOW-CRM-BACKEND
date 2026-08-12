import fs from 'fs';
import path from 'path';

const csvFilePath = path.join(process.cwd(), 'Punganur Cow.csv');
const jsonFilePath = path.join(process.cwd(), 'old_leads.json');

const convertCsvToJson = () => {
  try {
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    // The file appears to be tab-separated
    const headers = lines[0].split('\t').map(h => h.trim());
    
    const leads = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      
      const lead = {
        name: values[0] ? values[0].trim() : '',
        phone: values[1] ? values[1].trim() : '',
        email: values[2] ? values[2].trim() : '',
        city: values[3] ? values[3].trim().replace(/^"|"$/g, '') : '', // Remove quotes if any
        source: 'Website Form', // Assuming it's from a contact form based on headers like cf7sr-recaptcha
        service: 'Miniature Cow Sales',
        isOldLead: true,
      };
      
      // Parse joinedAt date (format: DD-MM-YYYY HH:MM)
      if (values[4]) {
        const dateStr = values[4].trim();
        const [datePart, timePart] = dateStr.split(' ');
        if (datePart && timePart) {
          const [day, month, year] = datePart.split('-');
          const [hour, minute] = timePart.split(':');
          if (year && month && day && hour && minute) {
             lead.joinedAt = new Date(`${year}-${month}-${day}T${hour}:${minute}:00.000Z`).toISOString();
          }
        }
      }
      
      // Only add if name and phone are present (required fields in model)
      if (lead.name && lead.phone) {
        leads.push(lead);
      }
    }
    
    fs.writeFileSync(jsonFilePath, JSON.stringify(leads, null, 2));
    console.log(`Successfully converted ${leads.length} leads to ${jsonFilePath}`);
  } catch (error) {
    console.error('Error converting CSV to JSON:', error);
  }
};

convertCsvToJson();
