const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const natural = require('natural');
const fs = require('fs').promises;
const app = express();
const port = 3000;

// Set up multer for file upload
const upload = multer({ dest: 'uploads/' });

// Define a list of common skills, qualifications, languages, frameworks, degrees, and action words
const keywords = [
  // Skills
  'Kubernetes', 'Docker', 'Golang', 'eBPF', 'microservices', 'AWS', 'Google Cloud Platform', 'problem-solving', 'communication', 'collaboration',
  // Languages
  'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'TypeScript',
  // Frameworks
  'React', 'Angular', 'Vue', 'Django', 'Flask', 'Spring', 'ASP.NET', 'Laravel', 'Rails', 'Express',
  // Degrees
  'Bachelor', 'Master', 'Computer Science', 'Software Engineering',
  // Action words
  'develop', 'design', 'implement', 'manage', 'lead', 'collaborate', 'optimize', 'troubleshoot', 'mentor', 'guide'
];

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

    // Check for the presence of each keyword in the job description and resume
    let matchCount = 0;
    let missingKeywords = [];
    for (const keyword of keywords) {
      if (lowerCaseJobDescription.includes(keyword.toLowerCase())) {
        if (lowerCaseResume.includes(keyword.toLowerCase())) {
          matchCount += 1;
          console.log('Matched keyword:', keyword);
        } else {
          missingKeywords.push(keyword);
        }
      }
    }

    // Calculate the match percentage
    const matchPercentage = (matchCount / keywords.length) * 100;
    let report = `Your resume matches ${matchPercentage.toFixed(2)}% of the job description.`;

    // Check if the match percentage meets the threshold
    const threshold = 75;
    if (matchPercentage >= threshold) {
      report += ' You passed the ATS check!';
    } else {
      report += ' You did not pass the ATS check. Consider adding the following keywords to your resume: ' + missingKeywords.join(', ');
    }

    // Send report to user
    res.send(report);

  } catch (error) {
    console.error('Error processing files:', error);
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