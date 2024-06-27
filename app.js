let data = [];  // Placeholder for the actual data

function initializeTableColumns() {
    const uniqueRelTypes = [...new Set(data.edges.map(edge => edge.relType))];
    const tableHead = document.getElementById('episodeTable').querySelector('thead');
    const headerRow = tableHead.insertRow();

    // Add Episode Column
    const episodeHeader = document.createElement('th');
    episodeHeader.innerText = 'Episode';
    headerRow.appendChild(episodeHeader);

    // Add "Has Guest" column
    const hasGuestHeader = document.createElement('th');
    hasGuestHeader.innerText = 'Has Guest';
    headerRow.appendChild(hasGuestHeader);

    // Add "Discussed Topic" column
    const discussedTopicHeader = document.createElement('th');
    discussedTopicHeader.innerText = 'Discussed Topic';
    headerRow.appendChild(discussedTopicHeader);

    // Remove 'Has Guest' and 'Discussed Topic' from uniqueRelTypes array
    const indexHasGuest = uniqueRelTypes.indexOf('has guest');
    if (indexHasGuest !== -1) {
        uniqueRelTypes.splice(indexHasGuest, 1);
    }

    const indexDiscussedTopic = uniqueRelTypes.indexOf('discussed topic');
    if (indexDiscussedTopic !== -1) {
        uniqueRelTypes.splice(indexDiscussedTopic, 1);
    }

    // Add other dynamic columns based on unique relationships
    uniqueRelTypes.forEach(relType => {
        const header = document.createElement('th');
        header.innerText = convertRelTypeToHeader(relType);
        headerRow.appendChild(header);
    });

    addEventListeners();
}


function convertRelTypeToHeader(relType) {
    const words = relType.split(' ');
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function populateAutocompleteList(nodes) {
    const autoCompleteList = document.getElementById('autoCompleteList');
    autoCompleteList.innerHTML = '';

    nodes.forEach(node => {
        const div = document.createElement('div');
        div.innerText = node.label;
        div.addEventListener('click', function () {
            document.getElementById('searchInput').value = node.label;
            renderTable(node.id);
            autoCompleteList.innerHTML = ''; // clear the autocomplete list
        });
        autoCompleteList.appendChild(div);
    });
}

function addEventListeners() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function () {
        const searchTerm = searchInput.value.toLowerCase();
        const matchedNodes = data.nodes.filter(node =>
            node.label.toLowerCase().includes(searchTerm) &&
            !node.label.startsWith('#')
        );
        populateAutocompleteList(matchedNodes);

        toggleInitialMessageAndTable();  // Add this line
    });
}

function getTableColumnIndexForRelType(relType) {
    const tableHeadRow = document.getElementById('episodeTable').querySelector('thead').rows[0];
    for (let i = 0; i < tableHeadRow.cells.length; i++) {
        if (tableHeadRow.cells[i].innerText === convertRelTypeToHeader(relType)) {
            return i;
        }
    }
    return -1; // if not found
}

function renderTable(nodeId) {
    const tableBody = document.getElementById('episodeTable').querySelector('tbody');
    const tableHeadRow = document.getElementById('episodeTable').querySelector('thead').rows[0];

    // Clear previous data
    tableBody.innerHTML = '';

    const relevantEdges = data.edges.filter(edge => edge.target === nodeId);
    let episodeIdsAdded = []; // Track which episode IDs have been added to prevent duplicates

    // Sort the episodes before rendering
    const sortedEpisodes = relevantEdges.map(edge => data.nodes.find(n => n.id === edge.source))
        .sort((a, b) => a.label.localeCompare(b.label));

    const numOfResults = relevantEdges.length;
    const topic = document.getElementById('searchInput').value;
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.innerText = `Showing ${numOfResults} results for ${topic}`;

    sortedEpisodes.forEach(episodeNode => {
        // If this episode ID has already been added, skip to the next one
        if (episodeIdsAdded.includes(episodeNode.id)) {
            return;
        }
        episodeIdsAdded.push(episodeNode.id);

        const row = tableBody.insertRow();

        // Initialize cells for each column
        for (let i = 0; i < tableHeadRow.cells.length; i++) {
            row.insertCell(i);
        }

        // Episode Column
        row.cells[0].innerText = episodeNode.label;

        // Other columns
        data.edges.forEach(re => {
            if (re.source === episodeNode.id) {
                const relatedNode = data.nodes.find(n => n.id === re.target);
                const columnIndex = getTableColumnIndexForRelType(re.relType);
                const cell = row.cells[columnIndex];
                const chip = document.createElement('span');
                chip.className = 'chip';
                chip.innerText = relatedNode.label;
                if (relatedNode.id === nodeId) {
                    chip.classList.add('active');
                }
                chip.addEventListener('click', function () {
                    document.getElementById('searchInput').value = relatedNode.label;
                    renderTable(relatedNode.id);
                });
                cell.appendChild(chip);
            }
        });
    });

    const tableHead = document.getElementById('episodeTable').querySelector('thead');
    tableHead.style.display = 'table-header-group';

    toggleInitialMessageAndTable();
}



function toggleInitialMessageAndTable() {
    const searchInputValue = document.getElementById('searchInput').value.trim();
    const initialMessage = document.getElementById('initialMessage');
    const episodeTable = document.getElementById('episodeTable');

    if (searchInputValue) {
        initialMessage.style.display = 'none';
        episodeTable.style.display = 'table';  // If using table layout
    } else {
        initialMessage.style.display = 'block';
        episodeTable.style.display = 'none';
    }
}

fetch('data.json')
    .then(response => response.json())
    .then(json => {
        data = json;
        initializeTableColumns(); // Initialize columns here!
        toggleInitialMessageAndTable();
    })
    .catch(err => console.error('Error fetching data:', err));
