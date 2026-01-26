import Dexie, { type Table } from 'dexie';

import type { Application, ChatMessage, ResumeSnapshot, UUID } from '@/entities/application/model/types';

export type ApplicationRow = Application;
export type ResumeSnapshotRow = ResumeSnapshot;
export type ChatMessageRow = ChatMessage;

export class AppDb extends Dexie {
  applications!: Table<ApplicationRow, UUID>;
  resumeSnapshots!: Table<ResumeSnapshotRow, UUID>;
  chatMessages!: Table<ChatMessageRow, UUID>;

  constructor() {
    super('job-finder');

    this.version(1).stores({
      applications: 'id, updatedAt, createdAt, title',
      resumeSnapshots: 'id, applicationId, createdAt',
      chatMessages: 'id, applicationId, createdAt, role',
    });
  }
}

export const appDb = new AppDb();
