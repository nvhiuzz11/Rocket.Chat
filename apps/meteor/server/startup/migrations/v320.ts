import { db } from '../../database/utils';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 320,
	name: 'Remove subtasks collection',
	async up() {
		try {
			// Drop the subtasks collection if it exists
			await db.collection('subtasks').drop();
			console.log('Subtasks collection dropped successfully');
		} catch (error) {
			// Collection might not exist, continue
			console.log('Subtasks collection does not exist or already dropped');
		}
	},
});
