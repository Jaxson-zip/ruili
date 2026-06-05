import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const inputDir = path.resolve(root, process.argv[2] ?? "apps/web/public/templates/jpg");
const outputPath = path.resolve(root, process.argv[3] ?? "artifacts/template-contact-sheet.png");

const files = fs
	.readdirSync(inputDir)
	.filter((file) => /\.(jpg|jpeg|png)$/i.test(file))
	.sort();

const thumbWidth = 180;
const thumbHeight = 254;
const labelHeight = 26;
const gap = 18;
const columns = 5;
const rows = Math.ceil(files.length / columns);
const width = columns * thumbWidth + (columns + 1) * gap;
const height = rows * (thumbHeight + labelHeight) + (rows + 1) * gap;

const escapeXml = (value) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

const composites = [];

await Promise.all(
	files.map(async (file, index) => {
		const left = gap + (index % columns) * (thumbWidth + gap);
		const top = gap + Math.floor(index / columns) * (thumbHeight + labelHeight + gap);
		const image = await sharp(path.join(inputDir, file))
			.resize(thumbWidth, thumbHeight, { fit: "contain", background: "#ffffff" })
			.png()
			.toBuffer();
		const label = Buffer.from(
			`<svg width="${thumbWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
				<rect width="100%" height="100%" fill="#111827"/>
				<text x="8" y="18" font-family="Arial" font-size="14" fill="#ffffff">${escapeXml(
					file.replace(/\.(jpg|jpeg|png)$/i, ""),
				)}</text>
			</svg>`,
		);

		composites.push({ input: image, left, top }, { input: label, left, top: top + thumbHeight });
	}),
);

await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
await sharp({
	create: {
		width,
		height,
		channels: 3,
		background: "#e5e7eb",
	},
})
	.composite(composites)
	.png()
	.toFile(outputPath);

console.log(outputPath);
