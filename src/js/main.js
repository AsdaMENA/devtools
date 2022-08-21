const selected = new Set();

const tools = [
	{
		icon: 1,
		title: 'Asda Texture Tool',
		link: './texture.html',
	},
	{
		icon: 2,
		title: 'Asda Binary Tool',
		link: './binary.html',
	},
];
function get(param) {
	let result = null,
		tmp = [];

	location.search
		.substring(1)
		.split('&')
		.forEach(function (item) {
			tmp = item.split('=');
			if (tmp[0] === param) result = decodeURIComponent(tmp[1]);
		});

	return result;
}

function updateTools() {
	const table = $('#tools');
	let tr = document.createElement('tr');
	table.append(tr);

	for (let i = 0; i < tools.length; ++i) {
		const tool = tools[i];
		const td = document.createElement('td');
		td.innerHTML = `<div class="tool" id="tool_${tool.icon}"><img class="icon" src="./img/tools/${tool.icon}.png"><div class="content"><span class="title">${tool.title}</span></div></div>`;
		tr.appendChild(td);

		$('#tool_' + tool.icon).on('click', () => {
			window.location.replace(tool.link);
		});

		if (i % 2) {
			tr = document.createElement('tr');
			table.append(tr);
		}
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

function goToHome() {
	window.location.replace('./index.html');
}

function updateSelected() {
	if ($('.selected').length) {
		$('#select_buttons')[0].style.display = 'block';
		$('#selected')[0].innerText = 'Selected ' + $('.selected').length;
	} else {
		$('#select_buttons')[0].style.display = 'none';
		$('#selected')[0].innerText = 'No selected rows.';
	}
}

function selectRow(e) {
	if (e.currentTarget.parentElement.className.indexOf(' selected') !== -1) {
		e.currentTarget.parentElement.setAttribute(
			'class',
			e.currentTarget.parentElement.className.replace(' selected', '')
		);
		selected.delete(
			+e.currentTarget.parentElement.id.replace('field_', '')
		);
	} else {
		e.currentTarget.parentElement.setAttribute(
			'class',
			e.currentTarget.parentElement.className + ' selected'
		);
		selected.add(+e.currentTarget.parentElement.id.replace('field_', ''));
	}
	updateSelected();
}

function progressBar(value) {
	const progressBar = $('#progress-bar');
	if (value !== null) {
		progressBar.removeClass('hidden');
		$('#progress-bar .placeholder')[0].style.width = value * 100 + '%';
		$('#progress-bar .percentage').text(Math.floor(value * 100) + '%');
		if (value >= 1) {
			setTimeout(() => {
				progressBar.addClass('hidden');
			}, 2000);
		}
	} else {
		progressBar.addClass('hidden');
	}
}

$(window).on('load', () => {
	$('#back-button').on('click', goToHome);

	progressBar(null);

	$(document).on('keydown', (ev) => {
		if (
			ev.code === 'F11' ||
			((ev.code === 'Equal' || ev.code === 'Minus') &&
				ev.ctrlKey &&
				ev.shiftKey)
		) {
			ev.preventDefault();
			ev.stopPropagation();
		}
	});

	AsdaParser.initReaders();
});
