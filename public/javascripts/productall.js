const search = document.querySelector('.input-group input'),
    table_rows = document.querySelectorAll('tbody tr'),
    table_headings = document.querySelectorAll('thead th');

// 1. Searching for specific data of HTML table
search.addEventListener('input', searchTable);

function searchTable() {
    table_rows.forEach((row, i) => {
        let table_data = row.textContent.toLowerCase(),
            search_data = search.value.toLowerCase();

        row.classList.toggle('hide', table_data.indexOf(search_data) < 0);
        row.style.setProperty('--delay', i / 25 + 's');
    })

    document.querySelectorAll('tbody tr:not(.hide)').forEach((visible_row, i) => {
        visible_row.style.backgroundColor = (i % 2 == 0) ? 'transparent' : '#0000000b';
    });
}

// 2. Sorting | Ordering data of HTML table
// Assuming you already have these variables defined
// let table_headings = document.querySelectorAll('th');
// let table_rows = document.querySelectorAll('tbody tr');

table_headings.forEach((head, i) => {
    let sort_asc = true;
    head.onclick = () => {
        table_headings.forEach(head => head.classList.remove('active'));
        head.classList.add('active');

        document.querySelectorAll('td').forEach(td => td.classList.remove('active'));
        table_rows.forEach(row => {
            row.querySelectorAll('td')[i].classList.add('active');
        });

        head.classList.toggle('asc', sort_asc);
        sort_asc = head.classList.contains('asc') ? false : true;

        sortTable(i, sort_asc, head.dataset.sortType);
    };
});

function sortTable(column, sort_asc, sortType) {
    [...table_rows].sort((a, b) => {
        let first_row = a.querySelectorAll('td')[column].textContent.toLowerCase();
        let second_row = b.querySelectorAll('td')[column].textContent.toLowerCase();

        if (sortType === 'numeric') {
            // Convert text to numbers for numerical sorting
            first_row = parseFloat(first_row);
            second_row = parseFloat(second_row);
        }

        return sort_asc ? (first_row > second_row ? 1 : -1) : (first_row > second_row ? -1 : 1);
    })
    .map(sorted_row => document.querySelector('tbody').appendChild(sorted_row));
}
function confirmDelete(postId) {
    var confirmation = confirm("Are you sure you want to delete this item?");
    if (confirmation) {
        // User clicked "OK", proceed with deletion
        window.location.href = "/deleteitem/" + postId;
    } else {
        // User clicked "Cancel", do nothing
    }
}