const fs = require('fs');
const files = [
    'src/pages/Search/styles.css',
    'src/pages/Profile/styles.css',
    'src/pages/Onboarding/styles.css',
    'src/pages/Browse/styles.css',
    'src/pages/AZList/styles.css'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Dynamic mappings from precise pixel values to responsive calc based on var(--card-min-width)
    content = content.replace(/minmax\(160px/g, 'minmax(calc(var(--card-min-width) + 20px)');
    content = content.replace(/minmax\(\s*min\(100%,\s*160px\)/g, 'minmax(min(100%, calc(var(--card-min-width) + 20px))');
    content = content.replace(/minmax\(\s*min\(100%,\s*130px\)/g, 'minmax(min(100%, calc(var(--card-min-width) - 10px))');
    content = content.replace(/minmax\(170px/g, 'minmax(calc(var(--card-min-width) + 30px)');
    content = content.replace(/minmax\(180px/g, 'minmax(calc(var(--card-min-width) + 40px)');
    content = content.replace(/minmax\(190px/g, 'minmax(calc(var(--card-min-width) + 50px)');
    content = content.replace(/minmax\(200px/g, 'minmax(calc(var(--card-min-width) + 60px)');
    content = content.replace(/minmax\(210px/g, 'minmax(calc(var(--card-min-width) + 70px)');
    content = content.replace(/minmax\(220px/g, 'minmax(calc(var(--card-min-width) + 80px)');

    fs.writeFileSync(file, content);
});
console.log('Update Complete');
