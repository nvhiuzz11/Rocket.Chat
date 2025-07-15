import type { IUser, IRocketChatRecord } from '@rocket.chat/core-typings';
import { BaseRaw } from '@rocket.chat/models';
import type { Db, IndexDescription, Filter, FindOptions } from 'mongodb';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface ITask extends IRocketChatRecord {
	title: string;
	description?: string;
	status: TaskStatus;
	creatorId: IUser['_id'];
	assigneeIds: IUser['_id'][];
	dueDate?: Date;
	createdAt: Date;
	updatedAt: Date;
}

// Lớp này chứa logic truy vấn trực tiếp đến database
export class TasksRaw extends BaseRaw<ITask> {
	constructor(db: Db) {
		// 'tasks' là tên collection trong MongoDB
		super(db, 'tasks');
	}

	// Các chỉ mục (index) để tối ưu tốc độ truy vấn
	protected modelIndexes(): IndexDescription[] {
		return [{ key: { creatorId: 1 } }, { key: { assigneeIds: 1 } }, { key: { status: 1 } }, { key: { dueDate: 1 } }];
	}

	// Hàm tạo task mới, dữ liệu đầu vào được kiểm soát chặt chẽ
	async createTask(creatorId: IUser['_id'], taskData: Pick<ITask, 'title' | 'description' | 'assigneeIds' | 'dueDate'>): Promise<ITask> {
		const now = new Date();
		const taskToInsert: Omit<ITask, '_id'> = {
			...taskData,
			creatorId, // creatorId được lấy từ user đã xác thực, không phải từ body
			status: 'todo', // Luôn bắt đầu với 'todo'
			createdAt: now,
			updatedAt: now,
		};

		const result = await this.insertOne(taskToInsert);
		// Lấy lại task vừa tạo từ DB để đảm bảo dữ liệu trả về là chính xác nhất
		const createdTask = await this.findOneById(result.insertedId);
		if (!createdTask) {
			throw new Error('Failed to create task');
		}
		return createdTask;
	}

	// Hàm cập nhật task, trả về task sau khi đã cập nhật
	async updateTask(
		taskId: ITask['_id'],
		updateData: Partial<Pick<ITask, 'title' | 'description' | 'assigneeIds' | 'dueDate' | 'status'>>,
	): Promise<ITask | null> {
		const updatePayload = {
			$set: {
				...updateData,
				updatedAt: new Date(),
			},
		};

		await this.updateOne({ _id: taskId }, updatePayload);
		return this.findOneById(taskId);
	}

	// Hàm tìm kiếm linh hoạt, phục vụ cho API lấy danh sách task
	async findTasks(query: Filter<ITask>, options?: FindOptions<ITask>): Promise<ITask[]> {
		return this.find(query, options).toArray();
	}
}
