function load(editor) {
    const filename = get('f');
    if (!filename) {
        ipcRenderer.invoke('error', 'Invalid parameters, you must provide "f" parameter.');
        return;
    }

    const type = path.basename(filename).replace('.json', '');

    readFile(filename, (err, data) => {
        if (err && err.toString().indexOf('ENOENT') !== -1) {
            editor.setValue(JSON.stringify({ $size: 8, $type: type, $table: '', $structure: {} }, null, 4));
            return;
        }
        if (err) {
            ipcRenderer.invoke('error', err.toString());
            return;
        }
        editor.setValue(data.toString());
    });

    $('#editor').on('keydown', (ev) => {
        if (ev.code === 'KeyS' && ev.ctrlKey) {
            writeFile(filename, editor.getValue(), (err) => {
                if (err)
                    ipcRenderer.invoke('error', err.toString());
            })
        }
    });
}