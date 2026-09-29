import { BaseAgent } from './base-agent.js';
import { PlanStep } from '../schemas/plan.schema.js';
import { SharedState } from '../state/shared-state.js';
import { RoutingDecision } from '../router/router.js';
import { SampleParcelRepository } from '../adapters/sample/sample-data-adapter.js';
import {
  pointInPolygon,
  calculateAreaAcres,
  calculateCentroid,
  normalizeTamilNumerals
} from '../geo/turf-utils.js';

export class GeographyAgent extends BaseAgent {
  private parcelRepo = new SampleParcelRepository();

  constructor() {
    super('GeographyAgent', 'geography');
  }

  protected async executeStep(state: SharedState, step: PlanStep, modelDecision: RoutingDecision) {
    const rawSurvey = step.inputs.surveyNumber || '202/55';
    const village = step.inputs.village || 'Sanganaperi';
    const cleanSurvey = normalizeTamilNumerals(rawSurvey);

    // 1. Resolve parcel from cadastral repository
    const parcel = await this.parcelRepo.findBySurveyNumber(village, cleanSurvey, step.inputs.subdivision);

    let geometry = parcel?.geometry;
    let centroid = parcel?.centroid;
    let recordedArea = parcel?.areaAcres || 2.10;

    // Fallback geometry if parcel geometry is not yet digitized
    if (!geometry) {
      geometry = {
        type: 'Polygon',
        coordinates: [
          [
            [77.3840, 9.2540],
            [77.3860, 9.2540],
            [77.3860, 9.2560],
            [77.3840, 9.2560],
            [77.3840, 9.2540]
          ]
        ]
      };
      centroid = calculateCentroid(geometry);
    } else if (!centroid) {
      centroid = calculateCentroid(geometry);
    }

    // 2. Compute GIS area using Turf.js
    const gisAreaAcres = calculateAreaAcres(geometry);
    const areaDiscrepancyPct = recordedArea > 0
      ? Number((Math.abs(gisAreaAcres - recordedArea) / recordedArea * 100).toFixed(1))
      : 0;

    // 3. Point-in-polygon verification if GPS coordinates were provided
    let gpsInside = true;
    let gpsWarning: string | undefined = undefined;

    if (step.inputs.coordinates?.latitude && step.inputs.coordinates?.longitude) {
      gpsInside = pointInPolygon(step.inputs.coordinates, geometry);
      if (!gpsInside) {
        gpsWarning = `User GPS location (${step.inputs.coordinates.latitude}, ${step.inputs.coordinates.longitude}) falls outside resolved parcel boundary.`;
      }
    }

    const confidence = parcel ? (gpsInside ? 0.96 : 0.82) : 0.78;

    const data = {
      district: parcel?.district || step.inputs.district || 'Tenkasi',
      taluk: parcel?.taluk || step.inputs.taluk || 'Sivagiri',
      village: parcel?.village || village,
      surveyNumber: cleanSurvey,
      subdivision: step.inputs.subdivision || parcel?.subdivision,
      geometry,
      centroid,
      areaAcres: recordedArea,
      gisAreaAcres,
      areaDiscrepancyPct,
      gpsInside,
      gpsWarning,
      provenance: parcel?.provenance || 'Sample data'
    };

    return {
      data,
      confidence,
      sources: [{
        id: parcel?.id || 'CAD-PARCEL-MAP',
        name: 'Cadastral Boundary Registry (GIS Layer)',
        provenance: (parcel?.provenance as any) || 'FarmwiseAI-provided'
      }],
      tokens: { input: 85, output: 65 }
    };
  }
}