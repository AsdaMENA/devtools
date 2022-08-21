const readers = {};

const binaries = [];
const TYPES_PATH = path.join(__dirname, 'js', 'tools', 'binary', 'types.json');
const BINARY_TYPES = JSON.parse(readFileSync(TYPES_PATH, 'utf-8'));

let binaryCounter = 0;


function exportBin(file, to, buffer) {
	return new Promise((resolve, reject) => {
		if (!file.endsWith('.bin')) {
			ipcRenderer.invoke('error', 'Cannot decrypt non-binary files.');
			return reject('Cannot decrypt non-binary files.');
		}
		const { reader, data } = AsdaParser.parse(buffer);

		if (reader && Object.keys(reader.$structure).length) {
			writeFile(path.join(to, reader.$table + '.sql'), AsdaParser.generateSQL(reader, data), () => { });

			writeFile(path.join(to, reader.$table + '.ts'), AsdaParser.generateEntity(reader, data), () => { });

			writeFile(path.join(to, path.basename(file).replace('bin', 'json').replace('BIN', 'json')), JSON.stringify(data, null, 4), () => { });
		}

		writeFile(path.join(to, path.basename(file).replace('bin', 'data').replace('BIN', 'data')), buffer, () => { });

		exec('start ' + to);

		resolve();
	});
}

function processBinaries(files) {
	files = [...new Set(files)];

	const table = $('#binaries');
	const tbody = $('#binaries tbody');

	let td;

	const structType = document.createElement('span');
	structType.className = 'structure-type';

	for (let file of files) {
		const tr = document.createElement('tr');
		const extension = path.extname(file).substring(1);
		file = file.replace(extension, extension.toLowerCase());
		if (binaries.includes(file)) continue;

		tr.id = 'field_' + binaryCounter++;

		td = document.createElement('td');
		td.className = 'code';
		td.innerText = path.basename(file);
		tr.appendChild(td);
		$(td).on('click', selectRow);

		const toDButton = document.createElement('button');
		const viewButton = document.createElement('button');

		const purefile = path.basename(file).replace('.' + extension, '');

		if (extension.toLowerCase() === 'bin') {
			AsdaBinary.decrypt(file)
				.then((buffer) => {
					const type = buffer.slice(12, 12 + 4).toString().replace('\x00', '');
					structType.innerText = type;
					structType.onclick = () => {
						window.open('./editor.html?f=' + encodeURIComponent('./src/core/readers/' + type + '.json'), '_blank', 'frame=0,contextIsolation=0,nodeIntegration=1,width=600,height=600,resizable=0');
					};
					const { reader, data } = AsdaParser.parse(buffer);

					if (!(purefile in BINARY_TYPES)) {
						BINARY_TYPES[purefile] = reader.$type;
						writeFile(TYPES_PATH, JSON.stringify(BINARY_TYPES, null, 4), () => { });
					}


					toDButton.className = 'btn primary';
					toDButton.innerText = 'Export';
					toDButton.onclick = () => {
						ipcRenderer.invoke('save-in');
						ipcRenderer.once('save-in', (event, dir) => {
							exportBin(file, dir, buffer);
						});
					};


					viewButton.className = 'btn secondary';
					viewButton.innerText = 'View data';
					viewButton.onclick = () => {

						localStorage.setItem('view', JSON.stringify(data));
						localStorage.setItem('reader', JSON.stringify(reader));
						window.open('./view.html', '_blank', 'frame=0,contextIsolation=0,nodeIntegration=1,resizable=0,width=700');
					}
				})
				.catch((err) => {
					ipcRenderer.invoke('error', err);
				});
		} else {
			console.log(BINARY_TYPES, purefile)
			structType.innerHTML = `<input type='text' placeholder='Binary Type' id='type_${binaryCounter}' value='${BINARY_TYPES[purefile] || ''}'/>`
		}


		const toBinary = document.createElement('button');
		toBinary.className = 'btn primary';
		toBinary.innerText = 'Convert';
		toBinary.onclick = () => {
			ipcRenderer.invoke('save-in');
			ipcRenderer.once('save-in', (event, dir) => {
				convertToBinary(file, dir);
			});
		};

		td = document.createElement('td');
		td.style.width = '200px';
		tr.appendChild(td);

		if (extension.toLowerCase() === 'bin') {
			td.appendChild(toDButton);
			td.appendChild(viewButton);
		} else {
			td.appendChild(toBinary);
		}

		td = document.createElement('td');
		td.appendChild(structType);
		tr.appendChild(td);


		tbody.append(tr);

		binaries.push(file);
	}
}

function onFileDrop(filterExtension, callback) {
	return function (e) {
		e.preventDefault();
		e.stopPropagation();

		const files = [];

		const eventFiles = e.originalEvent.dataTransfer.files;

		for (let i = 0; i < eventFiles.length; ++i) {
			const p = eventFiles.item(i).path;
			if (filterExtension.includes(path.extname(p).toLowerCase())) {
				files.push(p);
			}
		}
		$('#file-handler').removeClass('over');
		callback(files);
	};
}

function onDragOver(e) {
	e.preventDefault();
	e.stopPropagation();
	$('#file-handler').addClass('over');
}

function onDragLeave(e) {
	e.preventDefault();
	e.stopPropagation();
	$('#file-handler').removeClass('over');
}

function onFileHandlerClick(filters, callback) {
	return function (e) {
		ipcRenderer.invoke('open-files', filters);
		ipcRenderer.once('open-files', (event, files) => {
			callback(files);
		});
	};
}

window.onload = () => {
	const filterExt = ['.bin', '.json', '.data'];
	const filters = [
		{
			extensions: ['bin'],
			name: 'Asda Binary file',
		},
		{
			extensions: ['json', 'data'],
			name: 'Asda Data file',
		},
	];

	$('#file-handler').on('drop', onFileDrop(filterExt, processBinaries));
	$('#file-handler').on('dragover', onDragOver);
	$('#file-handler').on('dragleave', onDragLeave);
	$('#file-handler').on(
		'click',
		onFileHandlerClick(filters, processBinaries)
	);
};
