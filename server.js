const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const natural = require('natural');
const fs = require('fs').promises;
const cors = require('cors'); // Import cors
const app = express();
const port = 3000;
//To Do : Create wheighted sections for all the keywords / Link words together 
// Ex: If these is bacholors we dont need to loose points for masters but master could be wighed heavier
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
    
     // Additional Skills (continued)
'Continuous Integration', 'Continuous Deployment', 'Version Control', 'Git', 'Mercurial', 'Subversion',
'Microfrontend Architecture', 'RESTful APIs', 'GraphQL', 'Web Development', 'Frontend Development', 'Backend Development', 'Full-Stack Development',
'Container Orchestration', 'Infrastructure as Code', 'Configuration Management', 'Serverless Architecture', 'Service Meshes',
'Distributed Systems', 'Concurrency', 'Parallel Computing', 'Algorithms', 'Data Structures', 'Design Patterns',
'Object-Oriented Programming', 'Functional Programming', 'Aspect-Oriented Programming', 'Test-Driven Development', 'Behavior-Driven Development',
'Code Review', 'Refactoring', 'Code Optimization', 'Performance Tuning', 'Debugging', 'Logging', 'Monitoring',
'User Authentication', 'Authorization', 'OAuth', 'JWT', 'Single Sign-On', 'Multi-factor Authentication',
'Web Security', 'OWASP Top 10', 'Cross-Site Scripting', 'SQL Injection', 'Cross-Site Request Forgery', 'Secure Coding Practices',
'Multi-threading', 'Sockets Programming', 'Event-Driven Programming', 'Real-Time Systems', 'Websockets',
'Natural Language Processing', 'Computer Vision', 'Speech Recognition', 'Reinforcement Learning', 'Deep Learning',
'Model Deployment', 'Model Serving', 'Model Monitoring', 'Model Interpretability', 'Model Versioning',
'Predictive Analytics', 'Prescriptive Analytics', 'Streaming Analytics', 'Real-Time Data Processing', 'Batch Processing',
'Privacy-Preserving Techniques', 'Data Anonymization', 'Differential Privacy', 'Homomorphic Encryption',
'Cryptocurrency', 'Smart Contracts', 'Decentralized Finance', 'Tokenization', 'Consensus Algorithms',
'Infrastructure Security', 'Endpoint Security', 'Incident Response', 'Threat Intelligence', 'Security Auditing',
'Penetration Testing', 'Vulnerability Assessment', 'Security Architecture Design', 'Security Compliance',
'Web Application Firewall', 'Network Security', 'Firewall Configuration', 'Intrusion Detection Systems', 'Intrusion Prevention Systems',
'Identity and Access Management', 'Key Management', 'Public Key Infrastructure', 'Certificate Management',
'Machine Learning Operations', 'Model Deployment Pipelines', 'Continuous Model Training', 'Model Drift Detection',
'Explainable AI', 'Fairness in AI', 'Bias Detection and Mitigation', 'Ethical AI', 'Responsible AI',
'Search Engine Optimization', 'Keyword Research', 'Content Strategy', 'On-Page SEO', 'Off-Page SEO',
'User Interface Design', 'User Experience Design', 'Wireframing', 'Prototyping', 'Usability Testing',
'Mobile Application Development', 'iOS Development', 'Android Development', 'Cross-Platform Development', 'Native Development',
'Relational Databases', 'SQL', 'NoSQL Databases', 'Document Databases', 'Graph Databases', 'Key-Value Stores',
'Database Administration', 'Database Performance Tuning', 'Database Scaling', 'Data Replication', 'Sharding',
'Network Design', 'Network Protocols', 'TCP/IP', 'HTTP/HTTPS', 'DNS', 'DHCP', 'FTP', 'SSH',
'Load Balancing', 'High Availability', 'Disaster Recovery', 'Fault Tolerance', 'Content Delivery Networks',
'Edge Computing', 'Fog Computing', 'SDN (Software-Defined Networking)', 'Network Virtualization', 'SD-WAN',

    // Existing Languages
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'TypeScript',
    'Rust', 'Go', 'Scala', 'Perl', 'R', 'Shell', 'MATLAB', 'Groovy', 'Visual Basic .NET', 'Objective-C',
    // Additional Languages
    'Lua', 'Erlang', 'Haskell', 'Clojure', 'Julia', 'F#', 'Dart', 'Elm', 'Elixir', 'COBOL','Lua', 'Erlang', 'Haskell', 'Clojure', 'Julia', 'F#', 'Dart', 'Elm', 'Elixir', 'COBOL',
    'Assembly', 'Lisp', 'Prolog', 'Fortran', 'Scheme', 'Smalltalk', 'Tcl', 'Pascal', 'Ada', 'BASIC',
    'ActionScript', 'CoffeeScript', 'SQL', 'Apex', 'PL/SQL', 'Transact-SQL', 'Solidity',

    // Existing Frameworks
    'React', 'Angular', 'Vue', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET', 'Laravel', 'Ruby on Rails',
    'jQuery', 'Bootstrap', 'Node.js', 'Next.js', 'Nuxt.js', 'Gatsby', 'Svelte', 'Meteor', 'Ember.js',
    'Backbone.js', 'Aurelia', 'Mithril', 'Polymer', 'Alpine.js', 'Stimulus', 'Phoenix', 'LoopBack', 'NestJS',
    'Fastify', 'Strapi', 'Hapi.js', 'Quasar', 'Sapper', 'Cordova', 'Ionic', 'NativeScript', 'Electron',
    
    // Mobile Development
    'React Native', 'Flutter', 'Xamarin', 'Ionic', 'NativeScript', 'Cordova',

    // Data Science and Machine Learning
    'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'SciPy',
    'Jupyter', 'NLTK', 'Spacy', 'Gensim', 'Pyspark', 'Hadoop', 'Spark', 'Flink',

    // Testing
    'Jest', 'Mocha', 'Chai', 'Enzyme', 'Cypress', 'Selenium', 'Appium', 'JUnit', 'TestNG', 'Cucumber',

    // DevOps and Deployment
    'Docker', 'Kubernetes', 'Jenkins', 'CircleCI', 'Travis CI', 'GitLab CI', 'AWS', 'Azure', 'Google Cloud',
    'Heroku', 'Netlify', 'Vagrant', 'Terraform', 'Ansible', 'Puppet', 'Chef',

    // Backend Development and APIs
    'Express', 'Django', 'Flask', 'Spring Boot', 'ASP.NET Core', 'Laravel', 'Ruby on Rails', 'GraphQL', 
    'RESTful', 'SOAP', 'gRPC', 'Socket.IO', 'LoopBack', 'NestJS', 'Fastify', 'Strapi', 'Hapi.js', 'Falcon',

    // Database and ORM
    'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Redis', 'Elasticsearch', 'Cassandra', 'MariaDB', 'Firebase',
    'DynamoDB', 'Hibernate', 'Sequelize', 'Mongoose', 'SQLAlchemy', 'Room', 'TypeORM',

    // Frontend Development
    'HTML', 'CSS', 'JavaScript', 'TypeScript', 'Sass', 'Less', 'Webpack', 'Babel', 'Gulp', 'Grunt', 'Rollup',

    // Other Tools and Technologies
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'VS Code', 'IntelliJ IDEA', 'Eclipse', 'Sublime Text', 'Atom',
    'Visual Studio', 'Postman', 'Swagger', 'New Relic', 'Splunk', 'ELK Stack', 'Grafana', 'Prometheus',


    // Existing Degrees
    'Bachelor', 'Master', 'Computer Science', 'Software Engineering',
    // Additional Degrees
    'Information Technology', 'Information Systems', 'Data Science', 'Cybersecurity', 'Network Engineering', 'AI & Machine Learning', 'Software Development', 'Web Development',

    // Existing Action words
  'develop', 'design', 'implement', 'manage', 'lead', 'collaborate', 'optimize', 'troubleshoot', 'mentor', 'guide',
  'coordinate', 'establish', 'execute', 'launch', 'maintain', 'monitor', 'plan', 'research', 'resolve', 'validate',
  'analyze', 'assess', 'build', 'create', 'demonstrate', 'drive', 'enhance', 'facilitate', 'generate', 'identify',
  'influence', 'integrate', 'leverage', 'maximize', 'negotiate', 'outperform', 'produce', 'quantify', 'restructure', 'simplify',
  // Additional Action Words
  'automate', 'refactor', 'document', 'architect', 'evaluate', 'innovate', 'streamline', 'debug', 'communicate',
  'delegate', 'enforce', 'evolve', 'foster', 'introduce', 'modernize', 'oversee', 'prioritize', 'standardize'
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