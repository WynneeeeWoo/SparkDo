import fs from 'fs/promises';
import path from 'path';
import type { AIAnalysisResult } from './kimiAnalyzer';
import type { ExtractedFile } from './fileExtractor';

export interface SummaryFiles {
  todayPath: string;
  upcomingPath: string;
  crossSubjectPath: string;
  recentActivitiesPath: string;
}

export interface SummaryBundle {
  generatedAt: string;
  sourceFiles: { subject: string; fileName: string; error?: string }[];
  today: AIAnalysisResult['today'];
  upcoming: AIAnalysisResult['upcoming'];
  crossSubject: AIAnalysisResult['crossSubject'];
  recentActivities: AIAnalysisResult['recentActivities'];
}

export async function getSummaryPaths(userId: string, dataRoot: string): Promise<SummaryFiles> {
  const summaryDir = path.join(dataRoot, userId, 'Summary');
  await fs.mkdir(summaryDir, { recursive: true });
  return {
    todayPath: path.join(summaryDir, 'today.json'),
    upcomingPath: path.join(summaryDir, 'upcoming.json'),
    crossSubjectPath: path.join(summaryDir, 'cross_subject.json'),
    recentActivitiesPath: path.join(summaryDir, 'recent_activities.json'),
  };
}

export async function writeSummary(
  userId: string,
  dataRoot: string,
  result: AIAnalysisResult,
  sourceFiles: ExtractedFile[],
  generatedAt = new Date().toISOString()
): Promise<SummaryBundle> {
  const paths = await getSummaryPaths(userId, dataRoot);

  const bundle: SummaryBundle = {
    generatedAt,
    sourceFiles: sourceFiles.map((f) => ({ subject: f.subject, fileName: f.fileName, error: f.error })),
    today: result.today,
    upcoming: result.upcoming,
    crossSubject: result.crossSubject,
    recentActivities: result.recentActivities,
  };

  await fs.writeFile(paths.todayPath, JSON.stringify({ generatedAt, sourceFiles: bundle.sourceFiles, assignments: result.today }, null, 2));
  await fs.writeFile(paths.upcomingPath, JSON.stringify({ generatedAt, sourceFiles: bundle.sourceFiles, assignments: result.upcoming }, null, 2));
  await fs.writeFile(paths.crossSubjectPath, JSON.stringify({ generatedAt, sourceFiles: bundle.sourceFiles, crossSubject: result.crossSubject }, null, 2));
  await fs.writeFile(paths.recentActivitiesPath, JSON.stringify({ generatedAt, sourceFiles: bundle.sourceFiles, activities: result.recentActivities }, null, 2));

  return bundle;
}
