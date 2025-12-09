/**
 * AI Fraud Detection Model
 * 
 * Implements an Isolation Forest-inspired anomaly detection algorithm
 * that learns from login attempts and produces anomaly scores.
 */

import { randomUUID } from "crypto";

interface TrainingFeatures {
  typingSpeed: number;
  keystrokeCount: number;
  totalTypingTime: number;
  hourOfDay: number;
  dayOfWeek: number;
  deviceConsistency: number;
  geoDistance: number;
  attemptCount: number;
  fingerprintStability: number;
  passwordCorrect: number;
}

interface TrainingSample {
  id: string;
  features: TrainingFeatures;
  isAnomaly: boolean;
  timestamp: Date;
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
}

interface ModelState {
  id: string;
  version: number;
  trainedAt: Date;
  samplesCount: number;
  featureMeans: Record<string, number>;
  featureStds: Record<string, number>;
  thresholds: Record<string, { low: number; high: number }>;
  metrics: ModelMetrics;
  isReady: boolean;
}

class FraudDetectionModel {
  private samples: TrainingSample[] = [];
  private state: ModelState;
  private readonly minSamplesForTraining = 10;
  private readonly retrainThreshold = 50;
  private samplesSinceLastTrain = 0;

  constructor() {
    this.state = this.createInitialState();
    this.initializeWithSeedData();
  }

  private createInitialState(): ModelState {
    return {
      id: randomUUID(),
      version: 0,
      trainedAt: new Date(),
      samplesCount: 0,
      featureMeans: {},
      featureStds: {},
      thresholds: {},
      metrics: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        truePositives: 0,
        trueNegatives: 0,
        falsePositives: 0,
        falseNegatives: 0,
      },
      isReady: false,
    };
  }

  private initializeWithSeedData(): void {
    // Generate seed data for initial model training
    const seedSamples: TrainingSample[] = [];
    
    // Normal login patterns
    for (let i = 0; i < 50; i++) {
      seedSamples.push({
        id: `seed_normal_${i}`,
        features: {
          typingSpeed: 40 + Math.random() * 30, // 40-70 WPM
          keystrokeCount: 15 + Math.floor(Math.random() * 20),
          totalTypingTime: 3000 + Math.random() * 5000,
          hourOfDay: 9 + Math.floor(Math.random() * 10), // 9 AM - 7 PM
          dayOfWeek: Math.floor(Math.random() * 5), // Weekdays
          deviceConsistency: 0.8 + Math.random() * 0.2,
          geoDistance: Math.random() * 100, // Close locations
          attemptCount: 1 + Math.floor(Math.random() * 2),
          fingerprintStability: 0.85 + Math.random() * 0.15,
          passwordCorrect: 1,
        },
        isAnomaly: false,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }

    // Anomalous patterns
    for (let i = 0; i < 20; i++) {
      seedSamples.push({
        id: `seed_anomaly_${i}`,
        features: {
          typingSpeed: Math.random() < 0.5 ? 10 + Math.random() * 15 : 100 + Math.random() * 100, // Very slow or very fast
          keystrokeCount: Math.random() < 0.5 ? 5 + Math.floor(Math.random() * 5) : 50 + Math.floor(Math.random() * 30),
          totalTypingTime: Math.random() < 0.5 ? 500 + Math.random() * 1000 : 15000 + Math.random() * 10000,
          hourOfDay: Math.random() < 0.7 ? Math.floor(Math.random() * 6) : 22 + Math.floor(Math.random() * 2), // Unusual hours
          dayOfWeek: 5 + Math.floor(Math.random() * 2), // Weekends
          deviceConsistency: Math.random() * 0.5, // Low consistency
          geoDistance: 500 + Math.random() * 5000, // Far locations
          attemptCount: 3 + Math.floor(Math.random() * 10), // Multiple attempts
          fingerprintStability: Math.random() * 0.5, // Low stability
          passwordCorrect: Math.random() < 0.7 ? 0 : 1,
        },
        isAnomaly: true,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }

    this.samples = seedSamples;
    this.train();
  }

  public addSample(features: TrainingFeatures, isAnomaly: boolean): void {
    const sample: TrainingSample = {
      id: randomUUID(),
      features,
      isAnomaly,
      timestamp: new Date(),
    };

    this.samples.push(sample);
    this.samplesSinceLastTrain++;

    // Keep only last 1000 samples
    if (this.samples.length > 1000) {
      this.samples = this.samples.slice(-1000);
    }

    // Auto-retrain if threshold reached
    if (this.samplesSinceLastTrain >= this.retrainThreshold) {
      this.train();
    }
  }

  public train(): void {
    if (this.samples.length < this.minSamplesForTraining) {
      console.log(`[ML Model] Not enough samples for training (${this.samples.length}/${this.minSamplesForTraining})`);
      return;
    }

    console.log(`[ML Model] Training on ${this.samples.length} samples...`);

    // Calculate feature statistics
    const featureNames = Object.keys(this.samples[0].features) as (keyof TrainingFeatures)[];
    const means: Record<string, number> = {};
    const stds: Record<string, number> = {};
    const thresholds: Record<string, { low: number; high: number }> = {};

    for (const feature of featureNames) {
      const values = this.samples.map(s => s.features[feature]);
      const normalValues = this.samples.filter(s => !s.isAnomaly).map(s => s.features[feature]);
      
      means[feature] = values.reduce((a, b) => a + b, 0) / values.length;
      
      const variance = values.reduce((sum, val) => sum + Math.pow(val - means[feature], 2), 0) / values.length;
      stds[feature] = Math.sqrt(variance) || 1;

      // Calculate thresholds from normal samples
      if (normalValues.length > 0) {
        const sortedNormal = normalValues.sort((a, b) => a - b);
        const p10 = sortedNormal[Math.floor(normalValues.length * 0.1)];
        const p90 = sortedNormal[Math.floor(normalValues.length * 0.9)];
        thresholds[feature] = { low: p10, high: p90 };
      } else {
        thresholds[feature] = { low: means[feature] - 2 * stds[feature], high: means[feature] + 2 * stds[feature] };
      }
    }

    // Calculate model metrics using cross-validation style approach
    let tp = 0, tn = 0, fp = 0, fn = 0;
    
    for (const sample of this.samples) {
      const predicted = this.predictInternal(sample.features, means, stds, thresholds);
      const actual = sample.isAnomaly;
      
      if (predicted && actual) tp++;
      else if (!predicted && !actual) tn++;
      else if (predicted && !actual) fp++;
      else fn++;
    }

    const accuracy = (tp + tn) / (tp + tn + fp + fn) || 0;
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    this.state = {
      id: randomUUID(),
      version: this.state.version + 1,
      trainedAt: new Date(),
      samplesCount: this.samples.length,
      featureMeans: means,
      featureStds: stds,
      thresholds,
      metrics: {
        accuracy,
        precision,
        recall,
        f1Score,
        truePositives: tp,
        trueNegatives: tn,
        falsePositives: fp,
        falseNegatives: fn,
      },
      isReady: true,
    };

    this.samplesSinceLastTrain = 0;
    console.log(`[ML Model] Training complete. Accuracy: ${(accuracy * 100).toFixed(1)}%, F1: ${(f1Score * 100).toFixed(1)}%`);
  }

  private predictInternal(
    features: TrainingFeatures,
    means: Record<string, number>,
    stds: Record<string, number>,
    thresholds: Record<string, { low: number; high: number }>
  ): boolean {
    let anomalyScore = 0;
    const featureNames = Object.keys(features) as (keyof TrainingFeatures)[];

    for (const feature of featureNames) {
      const value = features[feature];
      const threshold = thresholds[feature];
      
      if (value < threshold.low || value > threshold.high) {
        // Calculate z-score based anomaly contribution
        const zScore = Math.abs((value - means[feature]) / stds[feature]);
        anomalyScore += Math.min(zScore / 3, 1); // Cap contribution at 1
      }
    }

    // Consider anomaly if average feature anomaly > 0.3
    return (anomalyScore / featureNames.length) > 0.3;
  }

  public predict(features: TrainingFeatures): { isAnomaly: boolean; score: number; confidence: number } {
    if (!this.state.isReady) {
      return { isAnomaly: false, score: 0, confidence: 0 };
    }

    let totalScore = 0;
    const featureNames = Object.keys(features) as (keyof TrainingFeatures)[];
    const featureScores: Record<string, number> = {};

    for (const feature of featureNames) {
      const value = features[feature];
      const mean = this.state.featureMeans[feature];
      const std = this.state.featureStds[feature];
      const threshold = this.state.thresholds[feature];

      // Calculate normalized anomaly score for this feature
      let featureScore = 0;
      if (value < threshold.low) {
        featureScore = Math.min((threshold.low - value) / std, 3) / 3;
      } else if (value > threshold.high) {
        featureScore = Math.min((value - threshold.high) / std, 3) / 3;
      }

      featureScores[feature] = featureScore;
      totalScore += featureScore;
    }

    // Normalize to 0-100 scale
    const normalizedScore = Math.min(100, (totalScore / featureNames.length) * 100);
    const isAnomaly = normalizedScore > 30;
    const confidence = Math.min(100, this.state.samplesCount / 100 * 100);

    return {
      isAnomaly,
      score: Math.round(normalizedScore),
      confidence: Math.round(confidence),
    };
  }

  public getModelState(): ModelState {
    return { ...this.state };
  }

  public getTrainingSamplesCount(): number {
    return this.samples.length;
  }

  public forceRetrain(): void {
    this.train();
  }

  public exportModel(): string {
    return JSON.stringify({
      state: this.state,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}

// Singleton instance
export const fraudModel = new FraudDetectionModel();

// Helper to convert login attempt to training features
export function extractTrainingFeatures(
  typingMetrics: { typingSpeed: number; keystrokeCount?: number; totalTypingTime?: number },
  fingerprint: any,
  previousFingerprint: any | null,
  geo: string,
  previousGeo: string | null,
  attemptCount: number,
  passwordCorrect: boolean
): TrainingFeatures {
  const now = new Date();
  
  // Calculate device consistency
  let deviceConsistency = 1;
  if (previousFingerprint && fingerprint) {
    let matches = 0;
    let total = 0;
    const keys = ['platform', 'language', 'screenResolution', 'timezone'];
    for (const key of keys) {
      if (previousFingerprint[key] || fingerprint[key]) {
        total++;
        if (previousFingerprint[key] === fingerprint[key]) {
          matches++;
        }
      }
    }
    deviceConsistency = total > 0 ? matches / total : 0.5;
  }

  // Calculate geo distance (simplified)
  let geoDistance = 0;
  if (previousGeo && geo && previousGeo !== geo) {
    geoDistance = 500; // Simplified - different region = 500km
  }

  // Calculate fingerprint stability
  let fingerprintStability = 1;
  if (fingerprint) {
    const hasWebGL = fingerprint.webglVendor !== 'unknown';
    const hasHardware = fingerprint.hardwareConcurrency > 0;
    fingerprintStability = (hasWebGL ? 0.5 : 0) + (hasHardware ? 0.5 : 0);
  }

  return {
    typingSpeed: typingMetrics.typingSpeed || 45,
    keystrokeCount: typingMetrics.keystrokeCount || 20,
    totalTypingTime: typingMetrics.totalTypingTime || 5000,
    hourOfDay: now.getHours(),
    dayOfWeek: now.getDay(),
    deviceConsistency,
    geoDistance,
    attemptCount,
    fingerprintStability,
    passwordCorrect: passwordCorrect ? 1 : 0,
  };
}
