const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const natural = require('natural');
const fs = require('fs').promises;
const cors = require('cors'); // Import cors
const app = express();
const port = 3000;

app.use(cors());
const keywords = require('./keywords.js');

const weights = {
  skills: 3,
  languages: 3,
  frameworks: 2,
  tools: 2,
  degrees: 1,
  actionWords: 1,
  softSkills: 1,
  industries: 1,
  positions: 1,
  certifications: 2,
  projects: 2
};

// Set up multer for file upload
const upload = multer({ dest: 'uploads/' })

// Route for uploading resume and job description
app.post('/api/process', upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'jobDescription', maxCount: 1 }]), async (req, res) => {
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  try {
    // Read files from filesystem
    const resumeBuffer = await fs.readFile(req.files.resume[0].path);
    const jobDescriptionBuffer = await fs.readFile(req.files.jobDescription[0].path);

    // Extract text from files
    let resumeText, jobDescriptionText;
    if (req.files.resume[0].mimetype === 'application/pdf') {
      resumeText = await pdfParse(resumeBuffer).catch(error => { console.error('Error parsing resume:', error); throw error; });
    } else {
      resumeText = { text: resumeBuffer.toString() };
    }
    if (req.files.jobDescription[0].mimetype === 'application/pdf') {
      jobDescriptionText = await pdfParse(jobDescriptionBuffer).catch(error => { console.error('Error parsing job description:', error); throw error; });
    } else {
      jobDescriptionText = { text: jobDescriptionBuffer.toString() };
    }

    // Convert the text to lowercase for case-insensitive matching
    const lowerCaseJobDescription = jobDescriptionText.text.toLowerCase();
    const lowerCaseResume = resumeText.text.toLowerCase();
    
    let matchCount = 0;
    let missingKeywords = [];
    let matchedKeywords = [];
    let jobDescriptionKeywords = [];
    let categoryCounts = {};
    let categoryMatches = {};
    
    for (const category in keywords) {
      for (const keyword of keywords[category]) {
        if (lowerCaseJobDescription.includes(keyword.toLowerCase())) {
          jobDescriptionKeywords.push({ keyword, category });
          if (!categoryCounts[category]) categoryCounts[category] = 0;
          categoryCounts[category]++;
          if (lowerCaseResume.includes(keyword.toLowerCase())) {
            matchCount += 1;
            matchedKeywords.push({ keyword, category });
            if (!categoryMatches[category]) categoryMatches[category] = 0;
            categoryMatches[category]++;
          } else {
            missingKeywords.push({ keyword, category });
          }
        }
      }
    }
    
    console.log('Matched Keywords:', matchedKeywords);
    
    // Calculate the match percentage
    const totalWeight = jobDescriptionKeywords.reduce((total, keywordObj) => total + weights[keywordObj.category], 0);
    const matchedWeight = matchedKeywords.reduce((total, keywordObj) => total + weights[keywordObj.category], 0);
    let matchPercentage = (matchedWeight / totalWeight) * 100;

    // Calculate category percentages and incorporate into final score
    let categoryPercentages = {};
    for (const category in categoryCounts) {
      const categoryPercentage = (categoryMatches[category] || 0) / categoryCounts[category];
      categoryPercentages[category] = categoryPercentage;
      matchPercentage += categoryPercentage * weights[category];
    }

    // Calculate final score
    let finalScore = matchPercentage;

    // Check if the match percentage meets the threshold
    const threshold = 75;
    let report = `Your resume matches ${matchPercentage.toFixed(2)}% of the job description.`;
    if (matchPercentage >= threshold) {
      report += ' You passed the ATS check!';
    } else {
      // Remove duplicate keywords
      const uniqueMissingKeywords = Array.from(new Set(missingKeywords.map(k => k.keyword)));
      report += ' You did not pass the ATS check. Consider adding the following keywords to your resume: ' + uniqueMissingKeywords.join(', ');
    }
    
    // Send report to user
    res.set('Content-Type', 'application/json');
    res.send({
      report,
      matchPercentage: matchPercentage.toFixed(2),
      keywords: matchedKeywords,
      missingKeywords: uniqueMissingKeywords, // Add this line
      categoryPercentages, // Add this line
      finalScore: finalScore.toFixed(2) // Add this line
    });
    
  } catch (error) {
    console.error('Error processing files:', error);
    console.error('Error stack:', error.stack);
    res.status(500).send('An error occurred while processing the files.');
  }
});

app.get('/test', (req, res) => {
  console.log('Received test request');
  res.send('Test successful');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});