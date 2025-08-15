import type { IRocketChatRecord, IUser, IRoom, ITeam } from '@rocket.chat/core-typings';

/**
 * @description Represents a Kanban or Table view workspace.
 * Each workspace is a workspace for a specific purpose.
 */

export type WorkspaceType = 'task' | 'recruitment' | 'deal';

export interface IWorkspace extends IRocketChatRecord {
	name: string; // Workspace name, e.g., "Task Management / Recruitment"
	description?: string; // A short description of the workspace
	type: WorkspaceType;

	// Link to the room in Rocket.Chat for notification and member synchronization
	roomId: IRoom['_id'];
	teamId?: ITeam['_id'];

	// Definitions of custom fields for items in this workspace
	// e.g., workspace "Recruitment" will have custom fields like "Position", "Source", "Salary"...
	fieldDefinitions: IFieldDefinition[];

	// List of users who can view, edit. Can use `userIds` or `roleIds`
	members: {
		userId: IUser['_id'];
		role: 'admin' | 'editor' | 'viewer';
	}[];

	createdAt: Date;
	createdBy: Pick<IUser, '_id' | 'username' | 'name'>;
}

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multi-select' | 'user' | 'checkbox' | 'attachment';

export interface IFieldDefinition {
	_id: string;
	name: string; // Field name, e.g., "Assignee", "Deal value"
	type: FieldType; // Field type to determine how to render in UI

	systemKey?: string;
	// Options for select or multi-select types
	options?: { _id: string; value: string; color?: string; order?: number }[];

	isRequired: boolean; // Is this field required?
}

/**
 * @description Core object, can be a task, a candidate, a deal...
 */
export interface IItem extends IRocketChatRecord {
	workspaceId: IWorkspace['_id']; // Link to the workspace that contains this item

	title: string; // The main title of the item, e.g., "Task 123", "CV Nguyen Van A"
	description?: string; // A short description of the item
	order: number; // The order of the item in a stage

	// Array of field values based on the workspace's `IFieldDefinition`s
	customFields: ICustomFieldValue[];

	createdAt: Date;
}

/**
 * @description Stores the actual value for a custom field on a specific item.
 */
export interface ICustomFieldValue {
	fieldId: IFieldDefinition['_id']; // Links to `IFieldDefinition._id` to know which field this is
	value: any; // The actual value, can be string, number, Date, string[] (for multi-select)...
}

// =========================== // // =========================== //
// =========================== // // =========================== //
// =========================== // // =========================== //
// Simulate MongoDB ObjectId type for better code readability
type ObjectId = string;

// Data types supported by the system
type CustomFieldType =
	| 'text' // Short string type
	| 'textarea' // Long string type
	| 'number' // Number type
	| 'date' // Date type
	| 'user' // Select one or more users
	| 'select' // Select one value from a list (dropdown)
	| 'multi-select'; // Select multiple values from a list

// Options for 'select' and 'multi-select' fields
interface IFieldOption {
	id: string;
	label: string;
	color?: string; // Optional color for the label
}

/**
 * @collection projects
 * @description Workspace containing boards
 */
interface IProject {
	_id: ObjectId;
	name: string;
	description?: string;
	members: ObjectId[]; // Array of user IDs belonging to the project
	createdAt: Date;
	updatedAt: Date;
}

/**
 * @collection boards
 * @description Kanban or Table board, defining columns and data structure of cards
 */
interface IBoard {
	_id: ObjectId;
	name: string;
	projectId: ObjectId; // Belongs to which project
	defaultView: 'kanban' | 'table'; // Default view mode

	// This is the core of flexibility:
	// Define custom fields that will be available on each card of this board
	customFields: ICustomFieldDefinition[];

	// Array of column IDs, used to maintain column order
	columnOrder: ObjectId[];

	createdAt: Date;
	updatedAt: Date;
}

/**
 * @interface ICustomFieldDefinition
 * @description Definition for a custom field
 */
interface ICustomFieldDefinition {
	_id: ObjectId; // Unique ID for this field definition
	label: string; // Display name for the field (e.g. "Assignee")
	type: CustomFieldType; // Data type of the field
	isRequired: boolean; // Is this field required?
	options?: IFieldOption[]; // Only used for 'select' and 'multi-select' types
}

/**
 * @collection columns
 * @description A column (status) in a board
 */
interface IColumn {
	_id: ObjectId;
	name: string;
	boardId: ObjectId; // Belongs to which board

	// Array of card IDs, used to maintain card order in the column
	cardOrder: ObjectId[];

	createdAt: Date;
	updatedAt: Date;
}

/**
 * @collection cards
 * @description A card in a column, containing flexible data
 */
interface ICard {
	_id: ObjectId;
	title: string; // Card title, the only fixed field
	description?: string; // Optional card description

	boardId: ObjectId;
	columnId: ObjectId; // Which column is this card in?

	// Actual data, matching the customFields definition of the Board
	fieldValues: ICustomFieldValue[];

	assignees?: ObjectId[]; // Optional field to query assignees quickly if this is a common field
	commentsCount: number;
	attachmentsCount: number;

	createdAt: Date;
	updatedAt: Date;
}

/**
 * @interface ICustomFieldValue
 * @description Actual value of a custom field on a card
 */
interface ICustomFieldValue {
	fieldId: ObjectId; // References the ICustomFieldDefinition._id
	value: any; // Value of any type, depending on the `type` of the field
}
