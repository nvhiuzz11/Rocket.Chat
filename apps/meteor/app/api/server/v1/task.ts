import { API } from '../api';

import { TasksRaw } from '../../../../server/models/raw/Tasks';
import { db } from '../../../../server/database/utils';

// Khởi tạo một instance của TasksRaw
const Tasks = new TasksRaw(db);

// POST /api/v1/tasks - Tạo task mới
API.v1.addRoute(
	'tasks.create',
	{ authRequired: true },
	{
		async post() {
			const { title, description, assigneeIds, dueDate } = this.bodyParams;

			// --- KIỂM TRA DỮ LIỆU ĐẦU VÀO ---
			if (!title || typeof title !== 'string') {
				return API.v1.failure('The "title" field is required.');
			}
			if (assigneeIds && !Array.isArray(assigneeIds)) {
				return API.v1.failure('The "assigneeIds" field must be an array.');
			}

			// --- LOGIC TẠO TASK ---
			// creatorId được lấy từ `this.userId` của người dùng đã đăng nhập.
			// Đây là cách làm bảo mật, tránh việc người dùng giả mạo người tạo.
			const taskData = { title, description, assigneeIds, dueDate };
			const newTask = await Tasks.createTask(this.userId, taskData);

			return API.v1.success({ task: newTask });
		},
	},
);

// PUT /api/v1/tasks/:taskId - Cập nhật task
API.v1.addRoute(
	'tasks/:taskId',
	{ authRequired: true },
	{
		async put() {
			const { taskId } = this.urlParams;
			const { title, description, assigneeIds, dueDate, status } = this.bodyParams;

			// --- KIỂM TRA TASK TỒN TẠI ---
			const task = await Tasks.findOneById(taskId);
			if (!task) {
				return API.v1.notFound('Task not found.');
			}

			// --- KIỂM TRA QUYỀN ---
			// Chỉ người tạo task mới có quyền chỉnh sửa
			if (task.creatorId !== this.userId) {
				return API.v1.unauthorized('You are not authorized to edit this task.');
			}

			// --- LOGIC CẬP NHẬT ---
			const updateData = { title, description, assigneeIds, dueDate, status };
			const updatedTask = await Tasks.updateTask(taskId, updateData);

			return API.v1.success({ task: updatedTask });
		},

		// DELETE /api/v1/tasks/:taskId - Xóa task
		async delete() {
			const { taskId } = this.urlParams;

			const task = await Tasks.findOneById(taskId);
			if (!task) {
				return API.v1.notFound('Task not found.');
			}

			// Chỉ người tạo task mới có quyền xóa
			if (task.creatorId !== this.userId) {
				return API.v1.unauthorized('You are not authorized to delete this task.');
			}

			await Tasks.deleteOne({ _id: taskId });
			return API.v1.success(); // Trả về 200 OK với body rỗng
		},
	},
);

// GET /api/v1/tasks.list - Lấy danh sách task (thêm endpoint riêng để không xung đột với :taskId)
API.v1.addRoute(
	'tasks.list',
	{ authRequired: true },
	{
		async get() {
			const { creatorId, assigneeId, status } = this.queryParams;
			const { offset, count } = this.getPaginationItems(); // Lấy thông tin phân trang

			const query: any = {};
			if (creatorId) {
				query.creatorId = creatorId === 'me' ? this.userId : creatorId;
			}
			if (assigneeId) {
				// Tìm các task mà mảng assigneeIds chứa ID này
				query.assigneeIds = assigneeId === 'me' ? this.userId : assigneeId;
			}
			if (status) {
				query.status = status;
			}

			const tasks = await Tasks.findTasks(query, {
				skip: offset,
				limit: count,
				sort: { createdAt: -1 },
			});
			const total = await Tasks.col.countDocuments(query);

			return API.v1.success({ tasks, count: tasks.length, offset, total });
		},
	},
);
