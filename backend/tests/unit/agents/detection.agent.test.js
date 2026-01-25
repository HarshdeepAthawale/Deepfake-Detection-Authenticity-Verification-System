/**
 * Agent Unit Tests
 * Tests for the 4-agent AI pipeline
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock logger
jest.mock('../../../src/utils/logger.js', () => ({
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    }
}));

// Mock ML client
jest.mock('../../../src/ml/ml-client.js', () => ({
    callMLService: jest.fn(),
    checkMLServiceHealth: jest.fn(),
}));

import { detectDeepfake, aggregatePredictions } from '../../../src/agents/detection.agent.js';
import { callMLService, checkMLServiceHealth } from '../../../src/ml/ml-client.js';

describe('Detection Agent', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('aggregatePredictions', () => {
        test('should aggregate single prediction correctly', () => {
            const predictions = [{
                riskScore: 75,
                confidence: 90,
                videoScore: 70,
                audioScore: 0,
                ganFingerprint: 75,
                temporalConsistency: 100,
                modelVersion: 'v1'
            }];

            const result = aggregatePredictions(predictions);

            expect(result.riskScore).toBe(75);
            expect(result.confidence).toBe(90);
            expect(result.frameCount).toBe(1);
            expect(result.variance).toBe(0);
            expect(result.uncertainty).toBe(0);
        });

        test('should aggregate multiple predictions with weighted average', () => {
            const predictions = [
                { riskScore: 80, confidence: 95, videoScore: 75, audioScore: 0, ganFingerprint: 80, temporalConsistency: 100, modelVersion: 'v1' },
                { riskScore: 60, confidence: 85, videoScore: 55, audioScore: 0, ganFingerprint: 60, temporalConsistency: 100, modelVersion: 'v1' },
                { riskScore: 70, confidence: 90, videoScore: 65, audioScore: 0, ganFingerprint: 70, temporalConsistency: 100, modelVersion: 'v1' }
            ];

            const result = aggregatePredictions(predictions);

            expect(result.frameCount).toBe(3);
            expect(result.riskScore).toBeGreaterThan(60);
            expect(result.riskScore).toBeLessThan(80);
            expect(result.variance).toBeGreaterThan(0);
        });

        test('should throw error for empty predictions', () => {
            expect(() => aggregatePredictions([])).toThrow('No predictions to aggregate');
        });
    });

    describe('detectDeepfake', () => {
        test('should call ML service and return results', async () => {
            const mockPerceptionData = {
                hash: 'test-hash',
                mediaType: 'VIDEO',
                extractedFrames: ['/path/to/frame1.jpg', '/path/to/frame2.jpg']
            };

            const mockMLResults = {
                riskScore: 75,
                confidence: 90,
                videoScore: 70,
                audioScore: 0,
                ganFingerprint: 75,
                temporalConsistency: 85,
                frameCount: 2,
                variance: 0.05,
                uncertainty: 5,
                modelVersion: 'v1'
            };

            checkMLServiceHealth.mockResolvedValue(true);
            callMLService.mockResolvedValue(mockMLResults);

            const result = await detectDeepfake(mockPerceptionData);

            expect(checkMLServiceHealth).toHaveBeenCalled();
            expect(callMLService).toHaveBeenCalledWith(mockPerceptionData);
            expect(result).toEqual(mockMLResults);
        });

        test('should throw error if ML service is unhealthy', async () => {
            checkMLServiceHealth.mockResolvedValue(false);

            const mockPerceptionData = {
                hash: 'test-hash',
                mediaType: 'VIDEO',
                extractedFrames: ['/path/to/frame1.jpg']
            };

            await expect(detectDeepfake(mockPerceptionData)).rejects.toThrow('ML service is not healthy');
        });
    });
});
