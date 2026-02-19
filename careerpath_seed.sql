USE cse3100_testA1;

-- Add timestamps to users table if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='cse3100_testA1' AND TABLE_NAME='users' AND COLUMN_NAME='created_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN created_at TIMESTAMP NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='cse3100_testA1' AND TABLE_NAME='users' AND COLUMN_NAME='updated_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN updated_at TIMESTAMP NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='cse3100_testA1' AND TABLE_NAME='users' AND COLUMN_NAME='remember_token');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN remember_token VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Update existing user password to be hashed
UPDATE users SET password = '$2y$12$LJ5QxKz1pSeMG9H7pHGVd.fGmAuAdQlZgxZPFnvICJPe74S04IShi' WHERE email = 'alice@example.com';

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255) DEFAULT 'Remote',
    type VARCHAR(255) DEFAULT 'Full-time',
    level VARCHAR(255) DEFAULT 'Entry Level',
    description TEXT,
    salary_min INT,
    salary_max INT,
    track VARCHAR(255),
    skills JSON,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    topic VARCHAR(255),
    instructor VARCHAR(255),
    duration VARCHAR(255),
    level VARCHAR(255) DEFAULT 'Beginner',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    course_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE KEY unique_enrollment (user_id, course_id)
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Personal access tokens (for Sanctum)
CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL,
    abilities TEXT,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE KEY personal_access_tokens_token_unique (token)
);

-- Seed Jobs
INSERT INTO jobs (title, company, location, type, level, description, salary_min, salary_max, track, skills, created_at, updated_at) VALUES
('Junior Frontend Developer', 'TechBD Solutions', 'Dhaka, Bangladesh', 'Full-time', 'Entry Level', 'Build responsive UIs using React and modern CSS frameworks. Work with our design team to implement pixel-perfect interfaces.', 25000, 45000, 'Software Engineering', '["React", "JavaScript", "CSS", "HTML", "Tailwind CSS"]', NOW(), NOW()),
('Backend Developer', 'DataSoft Systems', 'Chittagong, Bangladesh', 'Full-time', 'Mid Level', 'Design and implement RESTful APIs using Laravel. Optimize database queries and manage deployment pipelines.', 50000, 80000, 'Software Engineering', '["PHP", "Laravel", "MySQL", "REST API", "Docker"]', NOW(), NOW()),
('Data Analyst Intern', 'Grameenphone', 'Dhaka, Bangladesh', 'Internship', 'Entry Level', 'Analyze customer data patterns, create dashboards, and support data-driven business decisions.', 15000, 25000, 'Data Science', '["Python", "SQL", "Excel", "Power BI", "Statistics"]', NOW(), NOW()),
('Machine Learning Engineer', 'Pathao', 'Dhaka, Bangladesh', 'Full-time', 'Senior', 'Build and deploy ML models for route optimization and demand forecasting. Lead a team of data scientists.', 100000, 150000, 'Data Science', '["Python", "TensorFlow", "PyTorch", "MLOps", "AWS"]', NOW(), NOW()),
('UI/UX Designer', 'Sheba.xyz', 'Remote', 'Remote', 'Mid Level', 'Create user-centered designs for mobile and web applications. Conduct user research and usability testing.', 40000, 70000, 'Design', '["Figma", "Adobe XD", "User Research", "Prototyping", "Design Systems"]', NOW(), NOW()),
('DevOps Engineer', 'bKash', 'Dhaka, Bangladesh', 'Full-time', 'Mid Level', 'Manage CI/CD pipelines, containerized deployments, and cloud infrastructure for high-traffic fintech applications.', 70000, 120000, 'Software Engineering', '["Docker", "Kubernetes", "AWS", "Jenkins", "Linux"]', NOW(), NOW()),
('Mobile App Developer', 'Chaldal', 'Dhaka, Bangladesh', 'Full-time', 'Entry Level', 'Develop cross-platform mobile applications using React Native. Collaborate with backend team for API integration.', 30000, 55000, 'Software Engineering', '["React Native", "JavaScript", "TypeScript", "REST API", "Git"]', NOW(), NOW()),
('Cybersecurity Analyst', 'BRAC IT', 'Dhaka, Bangladesh', 'Full-time', 'Mid Level', 'Monitor security threats, conduct vulnerability assessments, and implement security best practices across the organization.', 60000, 95000, 'Cybersecurity', '["Network Security", "SIEM", "Penetration Testing", "Linux", "Python"]', NOW(), NOW()),
('Full Stack Developer', 'Selise Digital Platforms', 'Remote', 'Remote', 'Senior', 'Lead full-stack development projects using modern frameworks. Mentor junior developers and conduct code reviews.', 90000, 140000, 'Software Engineering', '["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"]', NOW(), NOW()),
('Content Writer - Tech', 'Bohubrihi', 'Remote', 'Part-time', 'Entry Level', 'Write engaging technical content for online courses and blog posts. Research trending technologies and create learning materials.', 15000, 30000, 'Content & Marketing', '["Technical Writing", "SEO", "Research", "Content Strategy", "WordPress"]', NOW(), NOW());

-- Seed Courses
INSERT INTO courses (name, description, topic, instructor, duration, level, created_at, updated_at) VALUES
('Complete Web Development Bootcamp', 'Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB in this comprehensive bootcamp. Build 10+ real-world projects.', 'Web Development', 'Dr. Kamal Hossain', '12 weeks', 'Beginner', NOW(), NOW()),
('Python for Data Science & AI', 'Master Python programming with focus on data analysis, visualization, and machine learning fundamentals using pandas, numpy, and scikit-learn.', 'Data Science', 'Prof. Nusrat Jahan', '8 weeks', 'Intermediate', NOW(), NOW()),
('Mobile App Development with React Native', 'Build cross-platform mobile applications for iOS and Android using React Native and Expo. Publish your app to stores.', 'Mobile Development', 'Eng. Rafiq Ahmed', '10 weeks', 'Beginner', NOW(), NOW()),
('Cloud Computing & AWS Fundamentals', 'Get started with cloud computing concepts and hands-on AWS services including EC2, S3, Lambda, and DynamoDB.', 'Cloud Computing', 'Dr. Fatema Akhter', '6 weeks', 'Beginner', NOW(), NOW()),
('Advanced Laravel API Development', 'Deep dive into building scalable REST APIs with Laravel, including authentication, testing, and deployment strategies.', 'Backend Development', 'Eng. Tanvir Islam', '8 weeks', 'Advanced', NOW(), NOW()),
('UI/UX Design Masterclass', 'Learn user-centered design principles, wireframing, prototyping with Figma, and design thinking methodology.', 'Design', 'Anika Rahman', '6 weeks', 'Beginner', NOW(), NOW()),
('Cybersecurity Essentials', 'Understand network security, ethical hacking basics, and security best practices for modern applications.', 'Cybersecurity', 'Prof. Mohammad Ali', '8 weeks', 'Intermediate', NOW(), NOW()),
('Machine Learning A-Z', 'Comprehensive ML course covering supervised and unsupervised learning, neural networks, and model deployment.', 'Artificial Intelligence', 'Dr. Shirin Akter', '14 weeks', 'Advanced', NOW(), NOW()),
('Digital Marketing for Tech Products', 'Learn SEO, social media marketing, content strategy, and analytics for technology products and startups.', 'Marketing', 'Farhana Sultana', '4 weeks', 'Beginner', NOW(), NOW());
