import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import {
  User, Profile, Skill, Interest, Project, ProjectRequirements,
  ProjectArchitecture, ProjectDatabase, ProjectApis, ProjectUI,
  ProjectRoadmap, Task, AiConversation, AiGenerationLog,
  TestCase, ProjectDocument, Notification, PortfolioPage,
  Technology, Category, AdminLog, UsageLog
} from '../models/types';

// Generic Collection Interface modeled after MongoDB
export interface QueryFilter {
  [key: string]: any;
}

export interface QueryOptions {
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
}

export class JsonCollection<T extends { _id: string }> {
  public readonly name: string;
  private filePath: string;
  private data: Map<string, T> = new Map();
  private isLoaded: boolean = false;

  constructor(name: string, dataDir: string) {
    this.name = name;
    this.filePath = path.join(dataDir, `${name}.json`);
    this.load();
  }

  private load() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const items: T[] = JSON.parse(raw);
        this.data.clear();
        for (const item of items) {
          if (item && item._id) {
            this.data.set(item._id, item);
          }
        }
      } else {
        this.saveSync([]);
      }
      this.isLoaded = true;
    } catch (err) {
      console.warn(`[Storage] Warning: Failed to load ${this.name}, using empty map:`, err);
      this.data.clear();
      this.isLoaded = true;
    }
  }

  private saveSync(items?: T[]) {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = items || Array.from(this.data.values());
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error(`[Storage] Error saving collection ${this.name}:`, err);
    }
  }

  private matchesFilter(item: any, filter?: QueryFilter): boolean {
    if (!filter || Object.keys(filter).length === 0) return true;

    for (const [key, value] of Object.entries(filter)) {
      if (key === '$or' && Array.isArray(value)) {
        const matchesAny = value.some(subFilter => this.matchesFilter(item, subFilter));
        if (!matchesAny) return false;
        continue;
      }
      if (key === '$and' && Array.isArray(value)) {
        const matchesAll = value.every(subFilter => this.matchesFilter(item, subFilter));
        if (!matchesAll) return false;
        continue;
      }

      const itemVal = this.getNestedValue(item, key);

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Operators: $in, $nin, $ne, $regex, $gt, $gte, $lt, $lte, $exists
        if ('$in' in value && Array.isArray(value.$in)) {
          if (!value.$in.includes(itemVal)) return false;
        } else if ('$nin' in value && Array.isArray(value.$nin)) {
          if (value.$nin.includes(itemVal)) return false;
        } else if ('$ne' in value) {
          if (itemVal === value.$ne) return false;
        } else if ('$regex' in value) {
          const regex = new RegExp(value.$regex, value.$options || 'i');
          if (typeof itemVal !== 'string' || !regex.test(itemVal)) return false;
        } else if ('$gt' in value) {
          if (!(itemVal > value.$gt)) return false;
        } else if ('$gte' in value) {
          if (!(itemVal >= value.$gte)) return false;
        } else if ('$lt' in value) {
          if (!(itemVal < value.$lt)) return false;
        } else if ('$lte' in value) {
          if (!(itemVal <= value.$lte)) return false;
        } else if ('$exists' in value) {
          const exists = itemVal !== undefined;
          if (exists !== Boolean(value.$exists)) return false;
        }
      } else {
        if (itemVal !== value) return false;
      }
    }
    return true;
  }

  private getNestedValue(obj: any, pathStr: string): any {
    if (!obj) return undefined;
    const parts = pathStr.split('.');
    let curr = obj;
    for (const part of parts) {
      if (curr === null || curr === undefined) return undefined;
      curr = curr[part];
    }
    return curr;
  }

  async find(filter: QueryFilter = {}, options: QueryOptions = {}): Promise<T[]> {
    let results: T[] = [];
    for (const item of this.data.values()) {
      if (this.matchesFilter(item, filter)) {
        // Return deep clone to prevent mutation
        results.push(JSON.parse(JSON.stringify(item)));
      }
    }

    if (options.sort) {
      const [field, direction] = Object.entries(options.sort)[0] || [];
      if (field) {
        results.sort((a, b) => {
          const valA = this.getNestedValue(a, field);
          const valB = this.getNestedValue(b, field);
          if (valA === valB) return 0;
          if (valA === undefined) return 1;
          if (valB === undefined) return -1;
          return direction === 1 ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });
      }
    }

    if (options.skip && options.skip > 0) {
      results = results.slice(options.skip);
    }

    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  async findOne(filter: QueryFilter): Promise<T | null> {
    for (const item of this.data.values()) {
      if (this.matchesFilter(item, filter)) {
        return JSON.parse(JSON.stringify(item));
      }
    }
    return null;
  }

  async findById(id: string): Promise<T | null> {
    const item = this.data.get(id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async insertOne(doc: Omit<T, '_id'> & { _id?: string }): Promise<T> {
    const id = doc._id || uuidv4();
    const newDoc = { ...doc, _id: id } as T;
    this.data.set(id, JSON.parse(JSON.stringify(newDoc)));
    this.saveSync();
    return JSON.parse(JSON.stringify(newDoc));
  }

  async insertMany(docs: Array<Omit<T, '_id'> & { _id?: string }>): Promise<T[]> {
    const inserted: T[] = [];
    for (const doc of docs) {
      const id = doc._id || uuidv4();
      const newDoc = { ...doc, _id: id } as T;
      this.data.set(id, JSON.parse(JSON.stringify(newDoc)));
      inserted.push(JSON.parse(JSON.stringify(newDoc)));
    }
    this.saveSync();
    return inserted;
  }

  async updateOne(filter: QueryFilter, update: any, options: { upsert?: boolean } = {}): Promise<{ matchedCount: number; modifiedCount: number; upsertedId?: string }> {
    const item = await this.findOne(filter);
    if (!item) {
      if (options.upsert) {
        const toInsert = update.$set ? { ...update.$set } : { ...update };
        const inserted = await this.insertOne(toInsert);
        return { matchedCount: 0, modifiedCount: 1, upsertedId: inserted._id };
      }
      return { matchedCount: 0, modifiedCount: 0 };
    }

    const current = this.data.get(item._id)!;
    this.applyUpdate(current, update);
    this.saveSync();
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(filter: QueryFilter, update: any): Promise<{ matchedCount: number; modifiedCount: number }> {
    let matchedCount = 0;
    let modifiedCount = 0;

    for (const [id, item] of this.data.entries()) {
      if (this.matchesFilter(item, filter)) {
        matchedCount++;
        this.applyUpdate(item, update);
        modifiedCount++;
      }
    }

    if (modifiedCount > 0) {
      this.saveSync();
    }

    return { matchedCount, modifiedCount };
  }

  private applyUpdate(target: any, update: any) {
    if (update.$set) {
      for (const [key, val] of Object.entries(update.$set)) {
        this.setNestedValue(target, key, val);
      }
    }
    if (update.$inc) {
      for (const [key, val] of Object.entries(update.$inc)) {
        const curr = this.getNestedValue(target, key) || 0;
        this.setNestedValue(target, key, curr + Number(val));
      }
    }
    if (update.$push) {
      for (const [key, val] of Object.entries(update.$push)) {
        const arr = this.getNestedValue(target, key) || [];
        if (Array.isArray(arr)) {
          arr.push(val);
          this.setNestedValue(target, key, arr);
        }
      }
    }
    if (update.$pull) {
      for (const [key, val] of Object.entries(update.$pull)) {
        const arr = this.getNestedValue(target, key) || [];
        if (Array.isArray(arr)) {
          const filtered = arr.filter((elem: any) => elem !== val && (elem as any)?.id !== (val as any)?.id);
          this.setNestedValue(target, key, filtered);
        }
      }
    }
    if (!update.$set && !update.$inc && !update.$push && !update.$pull) {
      Object.assign(target, update);
    }
    if ('updatedAt' in target) {
      target.updatedAt = new Date().toISOString();
    }
  }

  private setNestedValue(obj: any, pathStr: string, value: any) {
    const parts = pathStr.split('.');
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!curr[part] || typeof curr[part] !== 'object') {
        curr[part] = {};
      }
      curr = curr[part];
    }
    curr[parts[parts.length - 1]] = value;
  }

  async deleteOne(filter: QueryFilter): Promise<{ deletedCount: number }> {
    for (const [id, item] of this.data.entries()) {
      if (this.matchesFilter(item, filter)) {
        this.data.delete(id);
        this.saveSync();
        return { deletedCount: 1 };
      }
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter: QueryFilter): Promise<{ deletedCount: number }> {
    let deletedCount = 0;
    for (const [id, item] of this.data.entries()) {
      if (this.matchesFilter(item, filter)) {
        this.data.delete(id);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      this.saveSync();
    }
    return { deletedCount };
  }

  async countDocuments(filter: QueryFilter = {}): Promise<number> {
    if (Object.keys(filter).length === 0) {
      return this.data.size;
    }
    let count = 0;
    for (const item of this.data.values()) {
      if (this.matchesFilter(item, filter)) {
        count++;
      }
    }
    return count;
  }

  async clear(): Promise<void> {
    this.data.clear();
    this.saveSync([]);
  }
}

// Database Manager exposing all 22 collections
export class DatabaseManager {
  private static instance: DatabaseManager;
  public readonly users: JsonCollection<User>;
  public readonly profiles: JsonCollection<Profile>;
  public readonly skills: JsonCollection<Skill>;
  public readonly interests: JsonCollection<Interest>;
  public readonly projects: JsonCollection<Project>;
  public readonly project_requirements: JsonCollection<ProjectRequirements>;
  public readonly project_architecture: JsonCollection<ProjectArchitecture>;
  public readonly project_databases: JsonCollection<ProjectDatabase>;
  public readonly project_apis: JsonCollection<ProjectApis>;
  public readonly project_ui: JsonCollection<ProjectUI>;
  public readonly roadmaps: JsonCollection<ProjectRoadmap>;
  public readonly tasks: JsonCollection<Task>;
  public readonly ai_conversations: JsonCollection<AiConversation>;
  public readonly ai_generations: JsonCollection<AiGenerationLog>;
  public readonly test_cases: JsonCollection<TestCase>;
  public readonly documents: JsonCollection<ProjectDocument>;
  public readonly notifications: JsonCollection<Notification>;
  public readonly portfolio_pages: JsonCollection<PortfolioPage>;
  public readonly technologies: JsonCollection<Technology>;
  public readonly categories: JsonCollection<Category>;
  public readonly admin_logs: JsonCollection<AdminLog>;
  public readonly usage_logs: JsonCollection<UsageLog>;

  private constructor() {
    const dir = config.dataDir;
    this.users = new JsonCollection<User>('users', dir);
    this.profiles = new JsonCollection<Profile>('profiles', dir);
    this.skills = new JsonCollection<Skill>('skills', dir);
    this.interests = new JsonCollection<Interest>('interests', dir);
    this.projects = new JsonCollection<Project>('projects', dir);
    this.project_requirements = new JsonCollection<ProjectRequirements>('project_requirements', dir);
    this.project_architecture = new JsonCollection<ProjectArchitecture>('project_architecture', dir);
    this.project_databases = new JsonCollection<ProjectDatabase>('project_databases', dir);
    this.project_apis = new JsonCollection<ProjectApis>('project_apis', dir);
    this.project_ui = new JsonCollection<ProjectUI>('project_ui', dir);
    this.roadmaps = new JsonCollection<ProjectRoadmap>('roadmaps', dir);
    this.tasks = new JsonCollection<Task>('tasks', dir);
    this.ai_conversations = new JsonCollection<AiConversation>('ai_conversations', dir);
    this.ai_generations = new JsonCollection<AiGenerationLog>('ai_generations', dir);
    this.test_cases = new JsonCollection<TestCase>('test_cases', dir);
    this.documents = new JsonCollection<ProjectDocument>('documents', dir);
    this.notifications = new JsonCollection<Notification>('notifications', dir);
    this.portfolio_pages = new JsonCollection<PortfolioPage>('portfolio_pages', dir);
    this.technologies = new JsonCollection<Technology>('technologies', dir);
    this.categories = new JsonCollection<Category>('categories', dir);
    this.admin_logs = new JsonCollection<AdminLog>('admin_logs', dir);
    this.usage_logs = new JsonCollection<UsageLog>('usage_logs', dir);
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }
}

export const db = DatabaseManager.getInstance();
