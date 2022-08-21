
let textures = [];
let textureCounter = 0;

function clearTextures() {
	$('#textures tbody').remove();
	$('#textures').append('<tbody></tbody>');
	textures = [];
}

function exportImage(file, to) {
	return new Promise((resolve, reject) => {
		if (!file.endsWith('.tex')) {
			ipcRenderer.invoke(
				'error',
				'Cannot export image from non-texture file.'
			);
			return reject('Cannot export image from non-texture file.');
		}

		AsdaTexture.toImage(file)
			.then((result) => {
				const basefile = path.basename(file).toLowerCase();
				const output = path.join(
					to,
					basefile.replace('.tex', '.' + result.imageType)
				);

				writeFile(output, result.buffer, (err) => {
					if (err) {
						ipcRenderer.invoke('error', err.toString());
						return reject(err);
					}
					exec('start ' + to);
					resolve();
				});
			})
			.catch(reject);
	});
}

function convertImage(file, to) {
	return new Promise((resolve, reject) => {
		if (file.endsWith('.tex')) {
			const err =
				'Cannot convert a (texture) to texture file, only images allowed.';
			ipcRenderer.invoke('error', err);
			return reject(err);
		}

		AsdaTexture.fromImage(file)
			.then((buffer) => {
				const ext = path.extname(file);
				const basefile = path.basename(file);
				const output = path.join(to, basefile.replace(ext, '.tex'));

				writeFile(output, buffer, (err) => {
					if (err) {
						ipcRenderer.invoke('error', err.toString());
						reject(err);
					}

					exec('start ' + to);

					resolve();
				});
			})
			.catch(reject);
	});
}

function exportAll() {
	progressBar(0);
	ipcRenderer.invoke('save-in');
	ipcRenderer.once('save-in', (event, dir) => {
		let i = 0;
		const filter = textures.filter((value) => value.endsWith('.tex'));
		for (const texture of filter) {
			exportImage(texture, dir).then(() => {
				i++;
				progressBar(i / filter.length);
			});
		}
	});
}

function convertAll() {
	progressBar(0);
	ipcRenderer.invoke('save-in');
	ipcRenderer.once('save-in', (event, dir) => {
		let i = 0;
		const filter = textures.filter((value) => !value.endsWith('.tex'));
		for (const texture of filter) {
			convertImage(texture, dir).then(() => {
				i++;
				progressBar(i / filter.length);
			});
		}
	});
}

function exportSelected() {
	progressBar(0);
	ipcRenderer.invoke('save-in');
	ipcRenderer.once('save-in', (event, dir) => {
		let i = 0;
		for (const index of selected) {
			if (textures[index].endsWith('.tex')) {
				exportImage(textures[index], dir).then(() => {
					i++;
					progressBar(i / selected.length);
				});
			}
		}
	});
}

function convertSelected() {
	progressBar(0);
	ipcRenderer.invoke('save-in');
	ipcRenderer.once('save-in', (event, dir) => {
		let i = 0;
		for (const index of selected) {
			if (!textures[index].endsWith('.tex')) {
				exportImage(textures[index], dir).then(() => {
					i++;
					progressBar(i / selected.length);
				});
			}
		}
	});
}

function clearSelected() {
	for (const index of selected) {
		$('#field_' + index).remove();
		selected.delete(index);
		textures.splice(index, 1);
	}
	updateSelected();
}


function processTextures(files) {
	files = [...new Set(files)];
	const table = $('#textures');
	const tbody = $('#textures tbody');

	let td;

	for (let file of files) {
		const tr = document.createElement('tr');
		const extension = path.extname(file).substring(1);
		const previewWhitelist = ['png', 'jpg', 'jpeg', 'jfif', 'bmp'];
		file = file.replace(extension, extension.toLowerCase());

		if (textures.includes(file)) continue;

		tr.id = 'field_' + textureCounter++;

		if (previewWhitelist.includes(extension)) {
			const img = document.createElement('img');
			td = document.createElement('td');
			td.style.width = '150px';
			img.src = file;
			img.style.width = '50%';
			img.style.borderRadius = '5px';
			td.appendChild(img);
			tr.appendChild(td);
		} else {
			td = document.createElement('td');
			tr.appendChild(td);
		}

		const exportButton = document.createElement('button');
		exportButton.className = 'btn primary';
		exportButton.innerText = 'Export';
		exportButton.onclick = () => {
			ipcRenderer.invoke('save-in');
			ipcRenderer.once('save-in', (event, dir) => {
				console.log('xd');

				exportImage(file, dir);
			});
		};

		const convertButton = document.createElement('button');
		convertButton.className = 'btn info';
		convertButton.innerText = 'Convert';
		convertButton.onclick = () => {
			ipcRenderer.invoke('save-in');
			ipcRenderer.once('save-in', (event, dir) => {
				convertImage(file, dir);
			});
		};

		td = document.createElement('td');
		td.className = 'code';
		td.innerText = path.basename(file);
		tr.appendChild(td);
		$(td).on('click', selectRow);

		td = document.createElement('td');
		td.style.width = '200px';
		if (extension.toLowerCase() === 'tex') {
			td.appendChild(exportButton);
		} else {
			td.appendChild(convertButton);
		}
		tr.appendChild(td);

		tbody.append(tr);

		textures.push(file);
	}
}

window.onload = () => {
	const filterExt = [
		'.png',
		'.jpg',
		'.jpeg',
		'.jfif',
		'.dds',
		'.bmp',
		'.tga',
		'.tex',
	];
	const filters = [
		{
			extensions: ['tex'],
			name: 'Texture file',
		},
		{
			extensions: ['png', 'jpg', 'jpeg', 'jfif', 'dds', 'tga', 'bmp'],
			name: 'Image file',
		},
	];

	$('#file-handler').on('drop', onFileDrop(filterExt, processTextures));
	$('#file-handler').on('dragover', onDragOver);
	$('#file-handler').on('dragleave', onDragLeave);
	$('#file-handler').on(
		'click',
		onFileHandlerClick(filters, processTextures)
	);
};
