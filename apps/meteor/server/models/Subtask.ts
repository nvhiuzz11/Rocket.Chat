import { BaseRaw } from '@rocket.chat/models';
import type { Db, IndexDescription } from 'mongodb';

import type { ISubtask } from '../core-typings/ISubtask';

export class SubtaskRaw extends BaseRaw<ISubtask> {
	constructor(db: Db) {
		super(db, 'subtasks');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { taskId: 1 } }];
	}

	async create(data: Omit<ISubtask, '_id' | '_updatedAt'>): Promise<ISubtask> {
		const subtask = {
			...data,
			_updatedAt: new Date(),
		};

		const result = await this.insertOne(subtask);
		return { ...subtask, _id: result.insertedId };
	}

	async findByTaskId(taskId: string, options = {}) {
		return this.find({ taskId }, options);
	}
}
