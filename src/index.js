const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

if (require('electron-squirrel-startup')) {
	app.quit();
}
let mainWindow;
const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			nodeIntegrationInWorker: true,
			contextIsolation: false,
			enableRemoteModule: true,
			nativeWindowOpen: true,
		},
		resizable: false,
		titleBarStyle: 'hidden',
		frame: false,
		roundedCorners: false,
	});

	mainWindow.loadFile(path.join(__dirname, 'index.html'));
	mainWindow.webContents.openDevTools();
};
app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

ipcMain.handle('close-window', () => {
	if (mainWindow.isClosable()) mainWindow.close();
});

ipcMain.handle('minimize-window', () => {
	if (mainWindow.isMinimizable()) mainWindow.minimize();
});

ipcMain.handle('maxmize-window', () => {
	if (mainWindow.isMaximizable()) mainWindow.maximizable();
});

ipcMain.handle('save-in', (event) => {
	const dir = dialog.showOpenDialogSync(mainWindow, {
		title: 'Select where to save output files',
		properties: ['createDirectory', 'openDirectory'],
	});
	if (!dir) {
		dialog.showErrorBox(
			'Invalid directory',
			'You did not choose any directory to save output files in.'
		);
		return;
	}
	event.sender.send('save-in', dir[0]);
});

ipcMain.handle('open-files', (event, filters) => {
	const files = dialog.showOpenDialogSync(mainWindow, {
		title: 'Open files',
		filters,
		properties: ['multiSelections', 'openFile'],
	});
	event.sender.send('open-files', files);
});

ipcMain.handle('error', (event, err) => {
	dialog.showErrorBox('Unexpected Error', err);
});
