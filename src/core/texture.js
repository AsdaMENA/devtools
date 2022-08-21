const sizeOf = require('image-size');
const { readFile } = require('fs');

class AsdaTexture {
	static fromImage(content) {
		return new Promise((resolve, reject) => {
			if (typeof content === 'string') {
				readFile(content, (err, buffer) => {
					if (err) return reject(err);

					AsdaTexture.fromImage(buffer).then(resolve).catch(reject);
				});
			} else {
				let { width, height, type } = sizeOf(content);

				const buffer = Buffer.alloc(36);
				buffer.writeUInt32LE(0x20040603, 0);
				buffer.writeUInt32LE(content.length + 28, 4);

				buffer.writeUInt32LE(1, 16);
				buffer.writeUInt32LE(1, 20);
				buffer.writeUInt32LE(20, 24);
				buffer.writeUInt32LE(3, 28);

				switch (content[0]) {
					case 0x00:
						width = content.readUInt16LE(12);
						height = content.readUInt16LE(14);
						buffer[32] = 0x02;
						break;
					case 0x42:
						buffer[24] = 21;
						buffer[32] = 0x00;
						break;
					case 0x44:
						buffer[24] = content[84];
						buffer[25] = content[85];
						buffer[26] = content[86];
						buffer[27] = content[87];
						buffer[20] = 7;
						buffer[27] = buffer[27] === 35 ? 32 : buffer[27];
						buffer[32] = 0x04;
						break;
					case 0x89:
						buffer[24] = 21;
						buffer[32] = 0x03;
						break;
					case 0xff:
						buffer[24] = 22;
						buffer[32] = 0x01;
						break;
				}

				buffer.writeUInt32LE(width, 8);
				buffer.writeUInt32LE(height, 12);

				resolve(Buffer.concat([buffer, content]));
			}
		});
	}

	static toImage(content) {
		return new Promise((resolve, reject) => {
			if (typeof content === 'string') {
				readFile(content, (err, buffer) => {
					if (err) return reject(err);

					AsdaTexture.toImage(buffer).then(resolve).catch(reject);
				});
			} else {
				let imageType = '';
				switch (content[36]) {
					case 0x00:
						imageType = 'tga';
						break;
					case 0x42:
						imageType = 'bmp';
						break;
					case 0x44:
						imageType = 'dds';
						break;
					case 0x89:
						imageType = 'png';
						break;
					case 0xff:
						imageType = 'jfif';
						break;
				}

				if (!imageType) {
					return reject('Invalid image type detected.');
				}

				resolve({ buffer: content.slice(36), imageType });
			}
		});
	}
}

module.exports = AsdaTexture;
