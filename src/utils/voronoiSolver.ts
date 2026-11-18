export interface Point2D {
  x: number;
  y: number;
}

export type Polygon2D = Point2D[];

export function polygonArea(poly: Polygon2D): number {
  if (poly.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    sum += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(sum) * 0.5;
}

export function polygonCentroid(poly: Polygon2D): Point2D {
  if (poly.length === 0) return { x: 0, y: 0 };
  if (poly.length < 3) {
    const sx = poly.reduce((acc, p) => acc + p.x, 0);
    const sy = poly.reduce((acc, p) => acc + p.y, 0);
    return { x: sx / poly.length, y: sy / poly.length };
  }
  let area6 = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    const cross = p1.x * p2.y - p2.x * p1.y;
    area6 += cross;
    cx += (p1.x + p2.x) * cross;
    cy += (p1.y + p2.y) * cross;
  }
  if (Math.abs(area6) < 1e-7) {
    const sx = poly.reduce((acc, p) => acc + p.x, 0);
    const sy = poly.reduce((acc, p) => acc + p.y, 0);
    return { x: sx / poly.length, y: sy / poly.length };
  }
  return {
    x: cx / (3 * area6),
    y: cy / (3 * area6),
  };
}

export function polygonBoundingBox(poly: Polygon2D): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (poly.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
}

export function createRegularPolygon(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotationRad = -Math.PI / 2
): Polygon2D {
  const count = Math.max(3, Math.round(sides));
  const r = Math.max(1, radius);
  const pts: Polygon2D = [];
  for (let i = 0; i < count; i++) {
    const angle = rotationRad + (2 * Math.PI * i) / count;
    pts.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  return pts;
}

/**
 * Clips a convex polygon against the half-plane: a*x + b*y <= c
 * using Sutherland-Hodgman algorithm.
 */
export function clipPolygonHalfPlane(poly: Polygon2D, a: number, b: number, c: number): Polygon2D {
  if (poly.length === 0) return [];
  const output: Polygon2D = [];
  const eps = 1e-9;

  for (let i = 0; i < poly.length; i++) {
    const curr = poly[i];
    const prev = poly[(i + poly.length - 1) % poly.length];
    const dCurr = a * curr.x + b * curr.y - c;
    const dPrev = a * prev.x + b * prev.y - c;
    const currInside = dCurr <= eps;
    const prevInside = dPrev <= eps;

    if (currInside !== prevInside) {
      const denom = dPrev - dCurr;
      if (Math.abs(denom) > 1e-12) {
        const t = dPrev / denom;
        output.push({
          x: prev.x + t * (curr.x - prev.x),
          y: prev.y + t * (curr.y - prev.y),
        });
      }
    }
    if (currInside) {
      output.push(curr);
    }
  }
  return output;
}

function pointInsideConvexPolygon(pt: Point2D, poly: Polygon2D): boolean {
  if (poly.length < 3) return false;
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const cross = (b.x - a.x) * (pt.y - a.y) - (b.y - a.y) * (pt.x - a.x);
    if (Math.abs(cross) > 1e-7) {
      const curSign = cross > 0 ? 1 : -1;
      if (sign === 0) sign = curSign;
      else if (sign !== curSign) return false;
    }
  }
  return true;
}

interface PowerSite {
  x: number;
  y: number;
  weight: number;
  targetArea: number;
}

function computePowerCells(container: Polygon2D, sites: PowerSite[]): Polygon2D[] {
  return sites.map((siteI, i) => {
    let cell: Polygon2D = container;
    for (let j = 0; j < sites.length; j++) {
      if (i === j || cell.length === 0) continue;
      const siteJ = sites[j];
      const a = 2 * (siteJ.x - siteI.x);
      const b = 2 * (siteJ.y - siteI.y);
      const c =
        siteJ.x * siteJ.x +
        siteJ.y * siteJ.y -
        siteJ.weight -
        (siteI.x * siteI.x + siteI.y * siteI.y - siteI.weight);

      if (Math.abs(a) < 1e-9 && Math.abs(b) < 1e-9) {
        if (siteI.weight < siteJ.weight) return [];
        continue;
      }
      cell = clipPolygonHalfPlane(cell, a, b, c);
    }
    return cell;
  });
}

export interface WeightedItem {
  id: string;
  weight: number;
}

export interface PartitionedCell<T extends WeightedItem = WeightedItem> {
  item: T;
  polygon: Polygon2D;
  centroid: Point2D;
  area: number;
  bbox: ReturnType<typeof polygonBoundingBox>;
}

/**
 * Deterministic Weighted Voronoi (Power Diagram) treemap partition inside any convex polygon.
 * Guarantees exact polygonal tiling with zero gaps, zero overlaps, and strict containment.
 */
export function partitionPolygonWeighted<T extends WeightedItem>(
  container: Polygon2D,
  items: T[],
  iterations = 28
): PartitionedCell<T>[] {
  if (items.length === 0 || container.length < 3) return [];

  const totalArea = polygonArea(container);
  if (totalArea <= 1e-6) return [];

  if (items.length === 1) {
    return [
      {
        item: items[0],
        polygon: container,
        centroid: polygonCentroid(container),
        area: totalArea,
        bbox: polygonBoundingBox(container),
      },
    ];
  }

  const sanitizedWeights = items.map((it) => (Number.isFinite(it.weight) && it.weight > 0 ? it.weight : 1));
  const totalWeight = sanitizedWeights.reduce((acc, w) => acc + w, 0);
  const center = polygonCentroid(container);
  const bbox = polygonBoundingBox(container);
  const charRadius = Math.max(8, Math.min(bbox.width, bbox.height) * 0.28);

  // Golden-angle deterministic site initialization strictly inside the convex container
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const sites: PowerSite[] = items.map((_, i) => {
    const frac = (i + 0.5) / items.length;
    const r = charRadius * Math.sqrt(frac);
    const theta = i * goldenAngle;
    let x = center.x + r * Math.cos(theta);
    let y = center.y + r * Math.sin(theta);

    // Pull inward toward centroid until point is inside container
    for (let step = 0; step < 6 && !pointInsideConvexPolygon({ x, y }, container); step++) {
      x = center.x + (x - center.x) * 0.5;
      y = center.y + (y - center.y) * 0.5;
    }

    const targetArea = (sanitizedWeights[i] / totalWeight) * totalArea;
    return {
      x,
      y,
      weight: targetArea * 0.25,
      targetArea,
    };
  });

  let cells = computePowerCells(container, sites);

  for (let iter = 0; iter < iterations; iter++) {
    const damping = 0.55 * (1 - iter / (iterations * 1.4));

    for (let i = 0; i < sites.length; i++) {
      const cell = cells[i];
      const currentArea = polygonArea(cell);
      const areaDiff = sites[i].targetArea - currentArea;

      // Adapt power weight proportional to relative area error
      const weightStep = (areaDiff / totalArea) * charRadius * charRadius * 2.4 * damping;
      sites[i].weight += weightStep;

      if (cell.length >= 3 && currentArea > 1e-4) {
        const c = polygonCentroid(cell);
        sites[i].x = sites[i].x + (c.x - sites[i].x) * 0.65;
        sites[i].y = sites[i].y + (c.y - sites[i].y) * 0.65;
      } else {
        // Recover vanished cell by nudging toward container centroid and boosting weight
        sites[i].x = sites[i].x + (center.x - sites[i].x) * 0.45;
        sites[i].y = sites[i].y + (center.y - sites[i].y) * 0.45;
        sites[i].weight += charRadius * charRadius * 0.15;
      }
    }

    // Center weights around mean to prevent floating-point drift
    const meanWeight = sites.reduce((acc, s) => acc + s.weight, 0) / sites.length;
    for (const s of sites) {
      s.weight -= meanWeight;
    }

    cells = computePowerCells(container, sites);
  }

  return items.map((item, i) => {
    const poly = cells[i];
    return {
      item,
      polygon: poly,
      centroid: poly.length >= 3 ? polygonCentroid(poly) : center,
      area: polygonArea(poly),
      bbox: polygonBoundingBox(poly),
    };
  });
}
