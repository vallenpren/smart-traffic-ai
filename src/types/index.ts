export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'bus';

export interface DetectionResult {
  id: string;
  type: VehicleType;
  color?: string;
  timestamp: number;
  confidence: number;
}

export interface TrafficStats {
  total: number;
  byType: Record<VehicleType, number>;
  byColor: Record<string, number>;
}

export interface ExportData {
  summary: TrafficStats;
  history: DetectionResult[];
}
