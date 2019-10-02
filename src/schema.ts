// The database schema used by Mongoose
// Exports TypeScript interfaces to be used for type checking and Mongoose models derived from these interfaces
import { mongoose } from "./common";

// Secrets JSON file schema
export namespace IConfig {
	export interface Secrets {
		session: string;
		groundTruth: {
			url: string;
			id: string;
			secret: string;
		};
		bugsnag: string | null;
	}
	export interface Server {
		isProduction: boolean;
		port: number;
		versionHash: string;
		cookieMaxAge: number;
		cookieSecureOnly: boolean;
		mongoURL: string;
		defaultTimezone: string;
		name: string;
		adminDomains: string[];
		admins: string[];
	}

	export interface Main {
		secrets: Secrets;
		server: Server;
	}
}

// For stricter type checking of new object creation
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
interface RootDocument {
	_id: mongoose.Types.ObjectId;
}
export function createNew<T extends RootDocument>(model: mongoose.Model<T & mongoose.Document, {}>, doc: Omit<T, "_id">) {
	return new model(doc);
}
export type Model<T extends RootDocument> = T & mongoose.Document;

//
// DB types
//

export interface IUser extends RootDocument {
	uuid: string;
	email: string;
	name: {
		first: string;
		preferred?: string;
		last: string;
	};
	token: string | null;
	admin: boolean;

	company: string | null;
}

// This is basically a type definition that exists at runtime and is derived manually from the IUser definition above
export const User = mongoose.model<Model<IUser>>("User", new mongoose.Schema({
	uuid: {
		type: String,
		required: true,
		index: true,
		unique: true
	},
	email: {
		type: String,
		required: true,
		index: true,
		unique: true
	},
	name: {
		first: String,
		preferred: String,
		last: String,
	},
	token: String,
	admin: Boolean,
	company: String
}).index({
	email: "text",
	name: "text"
}));

export interface ICompany extends RootDocument {
	name: string;
	// Corresponds to registration UUIDs
	starred: string[];
	visited: string[];
}

export const Company = mongoose.model<Model<ICompany>>("Company", new mongoose.Schema({
	name: String,
	starred: [String],
	visited: [String]
}));

//
// Template schema
//

export interface TemplateContent {
	siteTitle: string;
	title: string;
	includeJS: string | null;
}
