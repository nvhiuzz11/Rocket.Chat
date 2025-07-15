const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Path to the locales directory
const LOCALES_DIR = path.join(__dirname, '../packages/i18n/src/locales');

// Translation map for different languages
const TRANSLATIONS = {
	'af': 'Span Take',
	'ar': 'مهام الفريق',
	'az': 'Komanda Tapşırıqları',
	'be-BY': 'Каманднія задачы',
	'bg': 'Екипни задачи',
	'bn-BD': 'টিম কাজ',
	'bn-IN': 'টিম কাজ',
	'bs': 'Timski zadaci',
	'ca': "Tasques de l'equip",
	'cs': 'Týmové úkoly',
	'cy': 'Tasgau Tîm',
	'da': 'Teamopgaver',
	'de-AT': 'Team-Aufgaben',
	'de-IN': 'Team-Aufgaben',
	'de': 'Team-Aufgaben',
	'el': 'Εργασίες ομάδας',
	'en': 'Team Tasks',
	'eo': 'Teamaj Taskoj',
	'es': 'Tareas del equipo',
	'et': 'Meeskonna ülesanded',
	'eu': 'Taldeko zereginak',
	'fa': 'وظایف تیم',
	'fi': 'Tiimin tehtävät',
	'fr': "Tâches d'équipe",
	'gl': 'Tarefas do equipo',
	'he': 'משימות צוות',
	'hi-IN': 'टीम कार्य',
	'hi': 'टीम कार्य',
	'hr': 'Timski zadaci',
	'hu': 'Csapat feladatok',
	'id': 'Tugas Tim',
	'it': 'Compiti del team',
	'ja': 'チームタスク',
	'ka-GE': 'გუნდის ამოცანები',
	'km': 'កិច្ចការក្រុម',
	'ko': '팀 작업',
	'ku': 'Peywirên Tîmê',
	'lo': 'ວຽກງານທີມ',
	'lt': 'Komandos užduotys',
	'lv': 'Komandas uzdevumi',
	'mn': 'Багийн даалгавар',
	'ms-MY': 'Tugas Pasukan',
	'nb': 'Lag oppgaver',
	'nl': 'Teamtaken',
	'nn': 'Lag oppgåver',
	'pa-IN': 'ਟੀਮ ਕਾਰਜ',
	'pl': 'Zadania zespołu',
	'pt-BR': 'Tarefas da equipe',
	'pt': 'Tarefas da equipa',
	'ro': 'Sarcini echipă',
	'ru': 'Командные задачи',
	'se': 'Joavkkobargut',
	'si': 'කණ්ඩායම් කාර්ය',
	'sk-SK': 'Tímové úlohy',
	'sl-SI': 'Naloge ekipe',
	'sq': 'Detyrat e ekipit',
	'sr': 'Тимски задаци',
	'sv': 'Laguppgifter',
	'ta-IN': 'குழு பணிகள்',
	'th-TH': 'งานทีม',
	'tr': 'Takım Görevleri',
	'ug': 'گۇرۇپپا ۋەزىپىلىرى',
	'uk': 'Командні завдання',
	'vi-VN': 'Nhiệm vụ nhóm',
	'zh-HK': '團隊任務',
	'zh-TW': '團隊任務',
	'zh': '团队任务',
};

async function processFile(filename) {
	try {
		const filePath = path.join(LOCALES_DIR, filename);
		const content = await readFile(filePath, 'utf8');

		// Skip if already has Team_Tasks
		if (content.includes('"Team_Tasks"')) {
			console.log(`Skipping ${filename} - already has Team_Tasks`);
			return;
		}

		// Extract language code from filename (e.g., 'en' from 'en.i18n.json')
		const langCode = filename.split('.')[0];
		const translation = TRANSLATIONS[langCode] || TRANSLATIONS['en']; // fallback to English

		// Parse JSON to work with the actual structure
		const jsonData = JSON.parse(content);

		// Add the new key in alphabetical order
		jsonData.Team_Tasks = translation;

		// Sort all keys alphabetically to maintain order
		const sortedKeys = Object.keys(jsonData).sort();
		const sortedData = {};

		sortedKeys.forEach((key) => {
			sortedData[key] = jsonData[key];
		});

		// Convert back to JSON with proper formatting
		const newContent = JSON.stringify(sortedData, null, 2);

		await writeFile(filePath, newContent, 'utf8');
		console.log(`Updated ${filename} with Team_Tasks: "${translation}"`);
	} catch (error) {
		console.error(`Error processing ${filename}:`, error.message);
	}
}

async function main() {
	try {
		const files = await readdir(LOCALES_DIR);
		const jsonFiles = files.filter((file) => file.endsWith('.i18n.json'));

		console.log(`Found ${jsonFiles.length} translation files to process`);

		for (const file of jsonFiles) {
			await processFile(file);
		}

		console.log('Finished processing all files');
	} catch (error) {
		console.error('Error:', error.message);
		process.exit(1);
	}
}

main();
