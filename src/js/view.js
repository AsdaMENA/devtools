$(window).on('load', () => {
    const columns = [];
    const fields = [];
    const data = [];

    const items = JSON.parse(localStorage.getItem('view'));
    const reader = JSON.parse(localStorage.getItem('reader'));

    for (const key in reader.$structure) {
        if (reader.$structure[key].$ignore) continue;
        columns.push(key);
    }

    for (const item of items) {
        const d = [];
        for (const o in item) {
            if (reader.$structure[o].$ignore) continue;
            d.push(item[o]);
        }
        data.push(d);
    }

    const datatable = new DataTable('#view', {
        data: {
            headings: columns,
            data
        }
    })

});