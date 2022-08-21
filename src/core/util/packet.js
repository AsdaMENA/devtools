const iconv = require('iconv-lite');

class Packet {
	constructor(buff) {
		this.buffer = Array.isArray(buff)
			? Buffer.from(buff)
			: Buffer.isBuffer(buff)
			? buff
			: Buffer.alloc(0);

		this.writePosition = this.length;
		this.readPosition = 0;

		if (typeof buff === 'number') {
			this.writeUnsignedShort(buff);
			this.opCode = buff;
		}
	}

	get length() {
		return this.buffer.length;
	}

	get available() {
		return this.buffer.slice(this.readPosition);
	}

	get availableBytes() {
		return this.length - this.readPosition;
	}

	expand(value) {
		if (this.length - this.writePosition < value) {
			this.buffer = Buffer.concat([
				this.buffer,
				Buffer.alloc(value - (this.length - this.writePosition)),
			]);
		}
	}

	reset() {
		this.buffer = null;
		this.writePosition = 0;
		this.readPosition = 0;
		this.buffer = Buffer.alloc(0);
	}

	get rest() {
		return this.buffer.slice(this.readPosition);
	}

	position(pos) {
		this.readPosition = pos;
		return this;
	}

	skip(length) {
		if (length <= this.availableBytes) {
			this.readPosition += length;
		} else {
			this.readPosition += this.availableBytes;
		}
		return this;
	}

	write(data) {
		let buffer = null;

		if (Buffer.isBuffer(data)) {
			buffer = data;
		} else if (Array.isArray(data) || typeof data === 'string') {
			buffer = Buffer.from(data);
		} else if (data instanceof Packet) {
			buffer = data.buffer;
		} else {
			throw 'The value type must be Buffer, Packet, string or number array.';
		}

		this.buffer = Buffer.concat([this.buffer, buffer]);
		this.writePosition += buffer.length;
		return this;
	}

	writeBool(value) {
		return this.writeByte(value ? 1 : 0);
	}

	writeByte(value) {
		this.expand(1);
		this.buffer.writeInt8(value, this.writePosition++);
		return this;
	}

	writeUnsignedByte(value) {
		this.expand(1);
		this.buffer.writeUInt8(value, this.writePosition++);
		return this;
	}

	writeShort(value) {
		this.expand(2);
		this.buffer.writeInt16LE(value, this.writePosition);
		this.writePosition += 2;
		return this;
	}

	writeUnsignedShort(value) {
		this.expand(2);
		this.buffer.writeUInt16LE(value, this.writePosition);
		this.writePosition += 2;
		return this;
	}

	writeInt(value) {
		this.expand(4);
		this.buffer.writeInt32LE(value, this.writePosition);
		this.writePosition += 4;
		return this;
	}

	writeUnsignedInt(value) {
		this.expand(4);
		this.buffer.writeUInt32LE(value, this.writePosition);
		this.writePosition += 4;
		return this;
	}

	writeLong(value) {
		this.expand(8);
		this.buffer.writeBigInt64LE(BigInt(value), this.writePosition);
		this.writePosition += 8;
		return this;
	}

	writeUnsignedLong(value) {
		this.expand(8);
		this.buffer.writeBigUInt64LE(BigInt(value), this.writePosition);
		this.writePosition += 8;
		return this;
	}

	writeFloat(value) {
		this.expand(4);
		this.buffer.writeFloatLE(value, this.writePosition);
		this.writePosition += 4;
		return this;
	}

	writeString(value, length, encode) {
		const buff = iconv.encode(value, encode);
		this.write(buff);
		if (!length) {
			this.writeByte(0);
			return this;
		}
		this.write(Buffer.from('\x00'.repeat(length - buff.length)));
		return this;
	}

	writeGarbage(size) {
		for (let i = 0; i < size; ++i) {
			this.writeUnsignedByte(Math.floor(Math.random() * 255));
		}
		return this;
	}

	readBuffer(length) {
		const value = this.buffer.slice(
			this.readPosition,
			this.readPosition + length
		);
		this.readPosition += length;
		return value;
	}

	readBool() {
		return this.readByte() === 1;
	}

	readByte() {
		return this.buffer.readInt8(this.readPosition++);
	}

	readUnsignedByte() {
		return this.buffer.readUInt8(this.readPosition++);
	}

	readShort() {
		const value = this.buffer.readInt16LE(this.readPosition);
		this.readPosition += 2;
		return value;
	}

	readUnsignedShort() {
		const value = this.buffer.readUInt16LE(this.readPosition);
		this.readPosition += 2;
		return value;
	}

	readInt() {
		const value = this.buffer.readInt32LE(this.readPosition);
		this.readPosition += 4;
		return value;
	}

	readUnsignedInt() {
		const value = this.buffer.readUInt32LE(this.readPosition);
		this.readPosition += 4;
		return value;
	}

	readLong() {
		const value = this.buffer.readBigInt64LE(this.readPosition);
		this.readPosition += 8;
		return value;
	}

	readUnsignedLong() {
		const value = this.buffer.readBigUInt64LE(this.readPosition);
		this.readPosition += 8;
		return value;
	}

	readFloat() {
		const value = this.buffer.readFloatLE(this.readPosition);
		this.readPosition += 4;
		return value;
	}

	readRawString(encode) {
		let end = this.readPosition + this.availableBytes;
		for (let i = 0; i < this.availableBytes; ++i) {
			if (this.buffer[this.readPosition + i] === 0) {
				end = this.readPosition + i;
				break;
			}
		}

		const buffer = this.buffer.slice(this.readPosition, end);
		this.readPosition += end - this.readPosition;
		return iconv.decode(buffer, encode);
	}

	readString(length = 0, encode = 'win1256') {
		if (!length) {
			return this.readRawString(encode);
		}

		let end = this.readPosition + length;
		for (let i = 0; i < length || this.availableBytes; ++i) {
			if (this.buffer[this.readPosition + i] === 0) {
				end = this.readPosition + i;
				break;
			}
		}
		const buffer = this.buffer.slice(this.readPosition, end);
		this.readPosition += length;
		return iconv.decode(buffer, encode);
	}

	toHex() {
		return (
			this.available
				.toString('hex')
				.toUpperCase()
				.match(/[0-9A-F]{2}/g)
				?.join(' ') || ''
		);
	}

	toString() {
		return this.available.toString('utf-8');
	}
}

module.exports = Packet;
