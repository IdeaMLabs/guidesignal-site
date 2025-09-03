// Script to automatically add contact button to all pages
// Run this to batch update all HTML files

const fs = require('fs');
const path = require('path');

const htmlFiles = [
    'apply.html',
    'how.html',
    'auth.html',
    'post.html',
    'faq.html',
    'dashboard.html',
    'my-jobs.html',
    'add-job.html',
    'privacy.html',
    'terms.html',
    'cohort.html',
    'outcome.html',
    'thanks.html',
    'demo.html',
    'presskit.html'
];

const contactScript = `    
    <!-- Contact Us Component -->
    <script src="contact-us.js" defer></script>`;

htmlFiles.forEach(filename => {
    try {
        const filePath = path.join(__dirname, filename);
        
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Check if contact script is already added
            if (!content.includes('contact-us.js')) {
                // Find the closing body tag and add before it
                content = content.replace('</body>', contactScript + '\n</body>');
                
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ Added contact button to ${filename}`);
            } else {
                console.log(`⏭️  Contact button already exists in ${filename}`);
            }
        } else {
            console.log(`⚠️  File not found: ${filename}`);
        }
    } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error.message);
    }
});

console.log('✅ Batch update completed!');