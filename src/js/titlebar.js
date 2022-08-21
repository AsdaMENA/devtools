$(window).on('load', () => {
	$('#close').on('click', () => {
		window.close();
	});

	$('#min').on('click', () => {
		ipcRenderer.invoke('minimize-window');
	});

	$('#max').on('click', () => {
		ipcRenderer.invoke('maxmize-window');
	});
    $('#title').text(document.title);
});