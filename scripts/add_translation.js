const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Path to the locales directory
const LOCALES_DIR = path.join(__dirname, '../packages/i18n/src/locales');

// Path to the translate.json file
const TRANSLATE_JSON_PATH = path.join(__dirname, 'translate.json');

// Translation map for different languages
const TRANSLATIONS = {
	'af': {
		Tasks: 'Take',
		Projects: 'Projekte',
		Team_Tasks: 'Span Take',
		Team_Projects: 'Span Projekte',
	},
	'ar': {
		Tasks: 'مهام',
		Projects: 'مشاريع',
		Team_Tasks: 'مهام الفريق',
		Team_Projects: 'مشاريع الفريق',
	},
	'az': {
		Tasks: 'Tapşırıqlar',
		Projects: 'Layihələr',
		Team_Tasks: 'Komanda Tapşırıqları',
		Team_Projects: 'Komanda Layihələri',
	},
	'be-BY': {
		Tasks: 'Задачы',
		Projects: 'Праекты',
		Team_Tasks: 'Каманднія задачы',
		Team_Projects: 'Каманднія праекты',
	},
	'bg': {
		Tasks: 'Задачи',
		Projects: 'Проекти',
		Team_Tasks: 'Екипни задачи',
		Team_Projects: 'Екипни проекти',
	},
	'bn-BD': {
		Tasks: 'কাজ',
		Projects: 'প্রকল্প',
		Team_Tasks: 'টিম কাজ',
		Team_Projects: 'টিম প্রকল্প',
	},
	'bn-IN': {
		Tasks: 'কাজ',
		Projects: 'প্রকল্প',
		Team_Tasks: 'টিম কাজ',
		Team_Projects: 'টিম প্রকল্প',
	},
	'bs': {
		Tasks: 'Zadaci',
		Projects: 'Projekti',
		Team_Tasks: 'Timski zadaci',
		Team_Projects: 'Timski projekti',
	},
	'ca': {
		Tasks: 'Tasques',
		Projects: 'Projectes',
		Team_Tasks: "Tasques de l'equip",
		Team_Projects: "Projectes de l'equip",
	},
	'cs': {
		Tasks: 'Úkoly',
		Projects: 'Projekty',
		Team_Tasks: 'Týmové úkoly',
		Team_Projects: 'Týmové projekty',
	},
	'cy': {
		Tasks: 'Tasgau',
		Projects: 'Prosiectau',
		Team_Tasks: 'Tasgau Tîm',
		Team_Projects: 'Prosiectau Tîm',
	},
	'da': {
		Tasks: 'Opgaver',
		Projects: 'Projekter',
		Team_Tasks: 'Teamopgaver',
		Team_Projects: 'Teamprojekter',
	},
	'de-AT': {
		Tasks: 'Aufgaben',
		Projects: 'Projekte',
		Team_Tasks: 'Team-Aufgaben',
		Team_Projects: 'Team-Projekte',
	},
	'de-IN': {
		Tasks: 'Aufgaben',
		Projects: 'Projekte',
		Team_Tasks: 'Team-Aufgaben',
		Team_Projects: 'Team-Projekte',
	},
	'de': {
		Tasks: 'Aufgaben',
		Projects: 'Projekte',
		Team_Tasks: 'Team-Aufgaben',
		Team_Projects: 'Team-Projekte',
	},
	'el': {
		Tasks: 'Εργασίες',
		Projects: 'Έργα',
		Team_Tasks: 'Εργασίες ομάδας',
		Team_Projects: 'Έργα ομάδας',
	},
	'en': {
		Tasks: 'Tasks',
		Projects: 'Projects',
		Team_Tasks: 'Team Tasks',
		Team_Projects: 'Team Projects',
	},
	'eo': {
		Tasks: 'Taskoj',
		Projects: 'Projektoj',
		Team_Tasks: 'Teamaj Taskoj',
		Team_Projects: 'Teamaj Projektoj',
	},
	'es': {
		Tasks: 'Tareas',
		Projects: 'Proyectos',
		Team_Tasks: 'Tareas del equipo',
		Team_Projects: 'Proyectos del equipo',
	},
	'et': {
		Tasks: 'Ülesanded',
		Projects: 'Projektid',
		Team_Tasks: 'Meeskonna ülesanded',
		Team_Projects: 'Meeskonna projektid',
	},
	'eu': {
		Tasks: 'Zereginak',
		Projects: 'Proiektuak',
		Team_Tasks: 'Taldeko zereginak',
		Team_Projects: 'Taldeko proiektuak',
	},
	'fa': {
		Tasks: 'وظایف',
		Projects: 'پروژه‌ها',
		Team_Tasks: 'وظایف تیم',
		Team_Projects: 'پروژه‌های تیم',
	},
	'fi': {
		Tasks: 'Tehtävät',
		Projects: 'Projektit',
		Team_Tasks: 'Tiimin tehtävät',
		Team_Projects: 'Tiimin projektit',
	},
	'fr': {
		Tasks: 'Tâches',
		Projects: 'Projets',
		Team_Tasks: "Tâches d'équipe",
		Team_Projects: "Projets d'équipe",
	},
	'gl': {
		Tasks: 'Tarefas',
		Projects: 'Proxectos',
		Team_Tasks: 'Tarefas do equipo',
		Team_Projects: 'Proxectos do equipo',
	},
	'he': {
		Tasks: 'משימות',
		Projects: 'פרויקטים',
		Team_Tasks: 'משימות צוות',
		Team_Projects: 'פרויקטי צוות',
	},
	'hi-IN': {
		Tasks: 'कार्य',
		Projects: 'परियोजनाएं',
		Team_Tasks: 'टीम कार्य',
		Team_Projects: 'टीम परियोजनाएं',
	},
	'hi': {
		Tasks: 'कार्य',
		Projects: 'परियोजनाएं',
		Team_Tasks: 'टीम कार्य',
		Team_Projects: 'टीम परियोजनाएं',
	},
	'hr': {
		Tasks: 'Zadaci',
		Projects: 'Projekti',
		Team_Tasks: 'Timski zadaci',
		Team_Projects: 'Timski projekti',
	},
	'hu': {
		Tasks: 'Feladatok',
		Projects: 'Projektek',
		Team_Tasks: 'Csapat feladatok',
		Team_Projects: 'Csapat projektek',
	},
	'id': {
		Tasks: 'Tugas',
		Projects: 'Proyek',
		Team_Tasks: 'Tugas Tim',
		Team_Projects: 'Proyek Tim',
	},
	'it': {
		Tasks: 'Compiti',
		Projects: 'Progetti',
		Team_Tasks: 'Compiti del team',
		Team_Projects: 'Progetti del team',
	},
	'ja': {
		Tasks: 'タスク',
		Projects: 'プロジェクト',
		Team_Tasks: 'チームタスク',
		Team_Projects: 'チームプロジェクト',
	},
	'ka-GE': {
		Tasks: 'ამოცანები',
		Projects: 'პროექტები',
		Team_Tasks: 'გუნდის ამოცანები',
		Team_Projects: 'გუნდის პროექტები',
	},
	'km': {
		Tasks: 'កិច្ចការ',
		Projects: 'គម្រោង',
		Team_Tasks: 'កិច្ចការក្រុម',
		Team_Projects: 'គម្រោងក្រុម',
	},
	'ko': {
		Tasks: '작업',
		Projects: '프로젝트',
		Team_Tasks: '팀 작업',
		Team_Projects: '팀 프로젝트',
	},
	'ku': {
		Tasks: 'Peywir',
		Projects: 'Proje',
		Team_Tasks: 'Peywirên Tîmê',
		Team_Projects: 'Projeyên Tîmê',
	},
	'lo': {
		Tasks: 'ວຽກງານ',
		Projects: 'ໂຄງການ',
		Team_Tasks: 'ວຽກງານທີມ',
		Team_Projects: 'ໂຄງການທີມ',
	},
	'lt': {
		Tasks: 'Užduotys',
		Projects: 'Projektai',
		Team_Tasks: 'Komandos užduotys',
		Team_Projects: 'Komandos projektai',
	},
	'lv': {
		Tasks: 'Uzdevumi',
		Projects: 'Projekti',
		Team_Tasks: 'Komandas uzdevumi',
		Team_Projects: 'Komandas projekti',
	},
	'mn': {
		Tasks: 'Даалгавар',
		Projects: 'Төсөл',
		Team_Tasks: 'Багийн даалгавар',
		Team_Projects: 'Багийн төсөл',
	},
	'ms-MY': {
		Tasks: 'Tugas',
		Projects: 'Projek',
		Team_Tasks: 'Tugas Pasukan',
		Team_Projects: 'Projek Pasukan',
	},
	'nb': {
		Tasks: 'Oppgaver',
		Projects: 'Prosjekter',
		Team_Tasks: 'Lag oppgaver',
		Team_Projects: 'Lag prosjekter',
	},
	'nl': {
		Tasks: 'Taken',
		Projects: 'Projecten',
		Team_Tasks: 'Teamtaken',
		Team_Projects: 'Teamprojecten',
	},
	'nn': {
		Tasks: 'Oppgåver',
		Projects: 'Prosjekt',
		Team_Tasks: 'Lag oppgåver',
		Team_Projects: 'Lag prosjekt',
	},
	'pa-IN': {
		Tasks: 'ਕਾਰਜ',
		Projects: 'ਪ੍ਰੋਜੈਕਟ',
		Team_Tasks: 'ਟੀਮ ਕਾਰਜ',
		Team_Projects: 'ਟੀਮ ਪ੍ਰੋਜੈਕਟ',
	},
	'pl': {
		Tasks: 'Zadania',
		Projects: 'Projekty',
		Team_Tasks: 'Zadania zespołu',
		Team_Projects: 'Projekty zespołu',
	},
	'pt-BR': {
		Tasks: 'Tarefas',
		Projects: 'Projetos',
		Team_Tasks: 'Tarefas da equipe',
		Team_Projects: 'Projetos da equipe',
	},
	'pt': {
		Tasks: 'Tarefas',
		Projects: 'Projetos',
		Team_Tasks: 'Tarefas da equipa',
		Team_Projects: 'Projetos da equipa',
	},
	'ro': {
		Tasks: 'Sarcini',
		Projects: 'Proiecte',
		Team_Tasks: 'Sarcini echipă',
		Team_Projects: 'Proiecte echipă',
	},
	'ru': {
		Tasks: 'Задачи',
		Projects: 'Проекты',
		Team_Tasks: 'Командные задачи',
		Team_Projects: 'Командные проекты',
	},
	'se': {
		Tasks: 'Barggut',
		Projects: 'Prošeavttaid',
		Team_Tasks: 'Joavkkobargut',
		Team_Projects: 'Joavkkoprošeavttaid',
	},
	'si': {
		Tasks: 'කාර්ය',
		Projects: 'ව්‍යාපෘති',
		Team_Tasks: 'කණ්ඩායම් කාර්ය',
		Team_Projects: 'කණ්ඩායම් ව්‍යාපෘති',
	},
	'sk-SK': {
		Tasks: 'Úlohy',
		Projects: 'Projekty',
		Team_Tasks: 'Tímové úlohy',
		Team_Projects: 'Tímové projekty',
	},
	'sl-SI': {
		Tasks: 'Naloge',
		Projects: 'Projekti',
		Team_Tasks: 'Naloge ekipe',
		Team_Projects: 'Projekti ekipe',
	},
	'sq': {
		Tasks: 'Detyrat',
		Projects: 'Projektet',
		Team_Tasks: 'Detyrat e ekipit',
		Team_Projects: 'Projektet e ekipit',
	},
	'sr': {
		Tasks: 'Задаци',
		Projects: 'Пројекти',
		Team_Tasks: 'Тимски задаци',
		Team_Projects: 'Тимски пројекти',
	},
	'sv': {
		Tasks: 'Uppgifter',
		Projects: 'Projekt',
		Team_Tasks: 'Laguppgifter',
		Team_Projects: 'Lagprojekt',
	},
	'ta-IN': {
		Tasks: 'பணிகள்',
		Projects: 'திட்டங்கள்',
		Team_Tasks: 'குழு பணிகள்',
		Team_Projects: 'குழு திட்டங்கள்',
	},
	'th-TH': {
		Tasks: 'งาน',
		Projects: 'โครงการ',
		Team_Tasks: 'งานทีม',
		Team_Projects: 'โครงการทีม',
	},
	'tr': {
		Tasks: 'Görevler',
		Projects: 'Projeler',
		Team_Tasks: 'Takım Görevleri',
		Team_Projects: 'Takım Projeleri',
	},
	'ug': {
		Tasks: 'ۋەزىپىلەر',
		Projects: 'تۈرلەر',
		Team_Tasks: 'گۇرۇپپا ۋەزىپىلىرى',
		Team_Projects: 'گۇرۇپپا تۈرلىرى',
	},
	'uk': {
		Tasks: 'Завдання',
		Projects: 'Проекти',
		Team_Tasks: 'Командні завдання',
		Team_Projects: 'Командні проекти',
	},
	'vi-VN': {
		Tasks: 'Nhiệm vụ',
		Projects: 'Dự án',
		Team_Tasks: 'Nhiệm vụ nhóm',
		Team_Projects: 'Dự án nhóm',
	},
	'zh-HK': {
		Tasks: '任務',
		Projects: '項目',
		Team_Tasks: '團隊任務',
		Team_Projects: '團隊項目',
	},
	'zh-TW': {
		Tasks: '任務',
		Projects: '項目',
		Team_Tasks: '團隊任務',
		Team_Projects: '團隊項目',
	},
	'zh': {
		Tasks: '任务',
		Projects: '项目',
		Team_Tasks: '团队任务',
		Team_Projects: '团队项目',
	},
};

// Function to read the translate.json file
async function readTranslateFile() {
	try {
		const content = await readFile(TRANSLATE_JSON_PATH, 'utf8');
		return JSON.parse(content);
	} catch (error) {
		console.error('Error reading translate.json:', error.message);
		console.log('Using default keys: ["Tasks", "Projects", "Team_Tasks", "Team_Projects"]');
		return ['Tasks', 'Projects', 'Team_Tasks', 'Team_Projects'];
	}
}

// Function to convert underscore-separated keys to space-separated translations
function convertKeyToTranslation(key, langCode) {
	// First check if we have a direct translation
	if (TRANSLATIONS[langCode] && TRANSLATIONS[langCode][key]) {
		return TRANSLATIONS[langCode][key];
	}

	// If not, try to build it from components
	const parts = key.split('_');
	const translatedParts = parts.map((part) => {
		if (TRANSLATIONS[langCode] && TRANSLATIONS[langCode][part]) {
			return TRANSLATIONS[langCode][part];
		}
		// Fallback to English
		if (TRANSLATIONS['en'] && TRANSLATIONS['en'][part]) {
			return TRANSLATIONS['en'][part];
		}
		return part; // Keep original if no translation found
	});

	return translatedParts.join(' ');
}

async function processFile(filename, keysToAdd) {
	try {
		const filePath = path.join(LOCALES_DIR, filename);
		const content = await readFile(filePath, 'utf8');

		// Extract language code from filename (e.g., 'en' from 'en.i18n.json')
		const langCode = filename.split('.')[0];

		// Parse JSON to work with the actual structure
		const jsonData = JSON.parse(content);

		let hasChanges = false;

		// Process each key from the translate.json file
		for (const key of keysToAdd) {
			// Skip if already exists
			if (jsonData[key]) {
				console.log(`Skipping ${key} in ${filename} - already exists`);
				continue;
			}

			// Get translation for this key
			const translation = convertKeyToTranslation(key, langCode);

			// Add the new key
			jsonData[key] = translation;
			hasChanges = true;

			console.log(`Added ${key} to ${filename}: "${translation}"`);
		}

		// Only write file if there were changes
		if (hasChanges) {
			// Sort all keys alphabetically to maintain order
			const sortedKeys = Object.keys(jsonData).sort();
			const sortedData = {};

			sortedKeys.forEach((key) => {
				sortedData[key] = jsonData[key];
			});

			// Convert back to JSON with proper formatting
			const newContent = JSON.stringify(sortedData, null, 2);

			await writeFile(filePath, newContent, 'utf8');
			console.log(`Updated ${filename} successfully`);
		} else {
			console.log(`No changes needed for ${filename}`);
		}
	} catch (error) {
		console.error(`Error processing ${filename}:`, error.message);
	}
}

async function main() {
	try {
		// Read the keys to add from translate.json
		const keysToAdd = await readTranslateFile();

		console.log('Keys to add:', keysToAdd);

		// Get all translation files
		const files = await readdir(LOCALES_DIR);
		const jsonFiles = files.filter((file) => file.endsWith('.i18n.json'));

		console.log(`Found ${jsonFiles.length} translation files to process`);

		// Process each file
		for (const file of jsonFiles) {
			await processFile(file, keysToAdd);
		}

		console.log('Finished processing all files');
	} catch (error) {
		console.error('Error:', error.message);
		process.exit(1);
	}
}

main();
