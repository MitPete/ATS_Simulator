const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const natural = require('natural');
const fs = require('fs').promises;
const cors = require('cors'); // Import cors
const app = express();
const port = 3000;

app.use(cors());

// Set up multer for file upload
const upload = multer({ dest: 'uploads/' });

// Define a list of common skills, qualifications, languages, frameworks, degrees, and action words
const keywords = [
    // Existing Skills
    'Kubernetes', 'Docker', 'Golang', 'eBPF', 'microservices', 'AWS', 'Google Cloud Platform', 'problem-solving', 'communication', 'collaboration',
    'Machine Learning', 'Data Science', 'Cybersecurity', 'Blockchain', 'DevOps', 'SEO', 'UI/UX Design', 'Mobile Development', 'Database Management', 'Network Architecture',
    // Additional Skills
    'Agile', 'Scrum', 'Kanban', 'Lean', 'Six Sigma', 'ITIL', 'PMP', 'CI/CD', 'TDD', 'BDD',
    'Cloud Computing', 'Big Data', 'IoT', 'AR/VR', 'Quantum Computing', 'Ethical Hacking', 'Data Mining', 'Data Visualization', 'Web Scraping', 'Robotic Process Automation',

    // Existing Languages
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'TypeScript',
    'Rust', 'Go', 'Scala', 'Perl', 'R', 'Shell', 'MATLAB', 'Groovy', 'Visual Basic .NET', 'Objective-C',
    // Additional Languages
    'Lua', 'Erlang', 'Haskell', 'Clojure', 'Julia', 'F#', 'Dart', 'Elm', 'Elixir', 'COBOL',

    // Existing Frameworks
    'React', 'Angular', 'Vue', 'Django', 'Flask', 'Spring', 'ASP.NET', 'Laravel', 'Rails', 'Express',
    'Bootstrap', 'jQuery', 'TensorFlow', 'PyTorch', 'Keras', 'Pandas', 'Scikit-learn', 'Unity', 'Unreal Engine', 'Cordova',
    // Additional Frameworks
    'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby', 'Strapi', 'LoopBack', 'NestJS', 'Fastify', 'Meteor', 'Ember.js',
    'Backbone.js', 'Aurelia', 'Mithril', 'Polymer', 'Alpine.js', 'Stimulus', 'Phoenix', 'Lucky', 'Hanami', 'Trailblazer',

    // Existing Degrees
    'Bachelor', 'Master', 'Computer Science', 'Software Engineering',
    // Additional Degrees
    'Information Technology', 'Information Systems', 'Data Science', 'Cybersecurity', 'Network Engineering', 'AI & Machine Learning', 'Software Development', 'Web Development',

    // Existing Action words
    'develop', 'design', 'implement', 'manage', 'lead', 'collaborate', 'optimize', 'troubleshoot', 'mentor', 'guide',
    'coordinate', 'establish', 'execute', 'launch', 'maintain', 'monitor', 'plan', 'research', 'resolve', 'validate',
    // Additional Action Words
    'analyze', 'assess', 'build', 'create', 'demonstrate', 'drive', 'enhance', 'facilitate', 'generate', 'identify',
    'influence', 'integrate', 'leverage', 'maximize', 'negotiate', 'outperform', 'produce', 'quantify', 'restructure', 'simplify'
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
    
    let matchCount = 0;
    let missingKeywords = [];
    let matchedKeywords = [];
    let jobDescriptionKeywords = [];
    
    for (const keyword of keywords) {
      if (lowerCaseJobDescription.includes(keyword.toLowerCase())) {
        jobDescriptionKeywords.push(keyword);
        if (lowerCaseResume.includes(keyword.toLowerCase())) {
          matchCount += 1;
          matchedKeywords.push(keyword);
        } else {
          missingKeywords.push(keyword);
        }
      }
    }
    console.log('Matched Keywords:', matchedKeywords);
    
    // Calculate the match percentage
    const matchPercentage = (matchCount / jobDescriptionKeywords.length) * 100;
    let report = `Your resume matches ${matchPercentage.toFixed(2)}% of the job description.`;
    
    // Check if the match percentage meets the threshold
    const threshold = 75;
    if (matchPercentage >= threshold) {
      report += ' You passed the ATS check!';
    } else {
      report += ' You did not pass the ATS check. Consider adding the following keywords to your resume: ' + missingKeywords.join(', ');
    }
    
    // Send report to user
    res.set('Content-Type', 'application/json');
    res.send({
      report,
      matchPercentage: matchPercentage.toFixed(2),
      keywords: matchedKeywords,
    });
    
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