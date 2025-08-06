import { db } from '../../database/utils';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 319,
	name: 'Rename TaskTag name field to value',
	async up() {
		// Rename the 'name' field to 'value' in task_tags collection
		await db.collection('task_tags').updateMany(
			{ name: { $exists: true } },
			{ $rename: { name: 'value' } }
		);
	},
});