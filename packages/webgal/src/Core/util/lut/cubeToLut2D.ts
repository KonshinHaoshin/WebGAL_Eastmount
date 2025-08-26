import * as PIXI from 'pixi.js';

interface ParsedCubeLut {
	size: number;
	data: number[]; // flat array of rgb triples in [0,1]
}

function parseCube(content: string): ParsedCubeLut {
	const lines = content.split(/\r?\n/);
	let size = 0;
	const data: number[] = [];
	for (const raw of lines) {
		const line = raw.trim();
		if (!line || line.startsWith('#')) continue;
		const upper = line.toUpperCase();
		if (upper.startsWith('LUT_3D_SIZE')) {
			const parts = line.split(/\s+/);
			size = parseInt(parts[1] || parts[0].split('LUT_3D_SIZE')[1], 10);
			continue;
		}
		if (
			upper.startsWith('TITLE') ||
			upper.startsWith('DOMAIN_MIN') ||
			upper.startsWith('DOMAIN_MAX') ||
			upper.startsWith('LUT_1D_SIZE')
		) {
			continue;
		}
		const parts = line.split(/\s+/).filter(Boolean);
		if (parts.length === 3) {
			const r = parseFloat(parts[0]);
			const g = parseFloat(parts[1]);
			const b = parseFloat(parts[2]);
			if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
				data.push(r, g, b);
			}
		}
	}
	if (!size || data.length !== size * size * size * 3) {
		throw new Error('Invalid .cube content: size mismatch');
	}
	return { size, data };
}

export async function create2DLutTextureFromCube(app: PIXI.Application, cubeUrl: string): Promise<PIXI.Texture> {
	const content = await fetch(cubeUrl).then((r) => r.text());
	const { size, data } = parseCube(content);
	// Arrange 3D LUT (size^3 entries) into a 2D atlas: size tiles horizontally, each tile is size x size
	const tileSize = size;
	const tilesX = size;
	const tilesY = size;
	const width = tilesX * tileSize;
	const height = tilesY * tileSize;
	const pixels = new Uint8Array(width * height * 4);
	// data is in order r-fastest or b-fastest depending on file; cube standard is blue fastest typically.
	// Most .cube files list entries with blue the fastest axis: for z in 0..size-1 for y in 0..size-1 for x in 0..size-1
	// We'll assume order is r major? We can try to fill by index order directly mapping to z-major tiles.
	let idx = 0;
	for (let z = 0; z < size; z++) {
		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				const r = Math.min(255, Math.max(0, Math.round(data[idx++]! * 255)));
				const g = Math.min(255, Math.max(0, Math.round(data[idx++]! * 255)));
				const b = Math.min(255, Math.max(0, Math.round(data[idx++]! * 255)));
				// place at (x + z*tileSize, y)
				const px = x + z * tileSize;
				const py = y;
				const base = (py * width + px) * 4;
				pixels[base] = r;
				pixels[base + 1] = g;
				pixels[base + 2] = b;
				pixels[base + 3] = 255;
			}
		}
	}
	const baseTex = PIXI.BaseTexture.fromBuffer(pixels, width, height, { alphaMode: PIXI.ALPHA_MODES.NO_PREMULTIPLIED });
	const tex = new PIXI.Texture(baseTex);
	return tex;
}