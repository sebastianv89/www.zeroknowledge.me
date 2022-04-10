// FIXME It is rapidly becoming a mess where in the code to update cells/store data
// instead it would be nice to have a single (global?) object that can be rendered (partially or fully)
// and that automatically stores/loads data as well when it changes

let playerCount = 2;
let rowCount = 1;

function htmlElement(html) {
	const template = document.createElement('template');
	template.innerHTML = html.trim();
	return template.content.firstChild;
}

function bodyCell() {
	const td = htmlElement('<td contenteditable="true" inputmode="decimal"></td>');
	td.addEventListener('focus', focusCell);
	td.addEventListener('blur', blurCell);
	return td;
}

function updateSums() {
	let sums = [];
	for (let x = 0; x < playerCount; x += 1) {
		sums.push(0);
	}

	for (const row of document.querySelectorAll('tbody tr')) {
		for (let x = 0; x < playerCount; x += 1) {
			sums[x] += Number(row.children[x + 1].textContent);
		}
	}

	const totals = document.querySelector('tfoot tr:last-child').children;
	for (let x = 0; x < playerCount; x += 1) {
		totals[x + 1].textContent = sums[x];
	}
}

function addRow() {
	rowCount += 1;
	const nextRow = htmlElement('<tr><td>' + rowCount + '</td></tr>');
	for (let i = 0; i < playerCount; i += 1) {
		nextRow.appendChild(bodyCell());
	}
	document.querySelector('tbody').appendChild(nextRow);
}

function cellInput(event) {
	if (event.target.parentElement.firstElementChild.textContent === rowCount.toString()) {
		addRow();
	}
	updateSums();
}

function addPlayer() {
	playerCount += 1;

	const th = htmlElement('<th contenteditable="true">Player ' + playerCount + '</th>');
	th.addEventListener('focus', focusCell);
	th.addEventListener('blur', blurCell);
	document.querySelector('thead tr').appendChild(th);
	th.focus();
	for (const row of document.querySelectorAll('tbody tr')) {
		row.appendChild(bodyCell());
	}
	document.querySelector('tfoot tr').appendChild(htmlElement('<td></td>'));
	updateSums();
}

function removeLastPlayer() {
	playerCount -= 1;

	document.querySelector('thead th:last-child').remove();
	for (const cell of document.querySelectorAll('tbody td:last-child')) {
		cell.remove();
	}
	document.querySelector('tfoot td:last-child').remove();
}

function setPlayerCount(newCount) {
	while (playerCount > newCount) {
		removeLastPlayer();
	}
	while (playerCount < newCount) {
		addPlayer();
	}
	storePlayers();
}

function changePlayerCount(event) {
	setPlayerCount(event.target.value)
}

function focusCell(event) {
	window.getSelection().selectAllChildren(event.target);
}

function storePlayers() {
	let players = [];
	for (const cell of document.querySelectorAll('thead tr th:not(:first-child)')) {
		players.push(cell.textContent);
	}
	localStorage.setItem('players', JSON.stringify(players));
}

function storeScores() {
	let scores = [];
	for (const tr of document.querySelectorAll('tbody tr:not(:last-child)')) {
		let row = [];
		for (const cell of tr.querySelectorAll('td:not(:first-child)')) {
			if (cell.textContent === "") {
				row.push("");
			} else {
				row.push(Number(cell.textContent));
			}
		}
		scores.push(row);
	}
	localStorage.setItem('scores', JSON.stringify(scores));
}

function blurCell(event) {
	window.getSelection().removeAllRanges();
	if (event.target.tagName === 'TH') {
		storePlayers();
	} else if (event.target.tagName == 'TD') {
		storeScores();
	}
}

function reset() {
	if (window.confirm("Reset all scores?")) {
		document.querySelector('tbody').textContent = "";
		rowCount = 0;
		addRow();
		updateSums();
		storeScores();
	}
}

function menu() {
	document.querySelector('dialog').showModal();
}

function exitDialog(event) {
	const dialog = document.querySelector('dialog');
	const rect = dialog.getBoundingClientRect();
	if (event.clientY < rect.top || rect.bottom < event.clientY || event.clientX < rect.left || rect.right < event.clientY) {
		dialog.close();
	}
}

function loadStorage() {
	const players = JSON.parse(localStorage.getItem('players'));
	if (players !== null) {
		document.getElementById('playerCount').value = players.length;
		setPlayerCount(players.length);
		const headCells = document.querySelectorAll('thead tr th:not(:first-child)');
		for (let i = 0; i < playerCount; i += 1) {
			headCells[i].textContent = players[i];
		}
		storePlayers();
	}

	const scores = JSON.parse(localStorage.getItem('scores'));
	if (scores !== null) {
		const tbody = document.querySelector('tbody');
		for (let y = 0; y < scores.length; y += 1) {
			addRow();
			const tr = tbody.children[y];
			for (let x = 0; x < scores[y].length; x += 1) {
				tr.children[x + 1].textContent = scores[y][x];
			}
		}
	}
	updateSums();
}

window.addEventListener('DOMContentLoaded', function() {
	document.querySelector('tbody').addEventListener('input', cellInput);
	for (let cell of document.querySelectorAll('tbody td:not(:first-child), thead th')) {
		cell.addEventListener('focus', focusCell);
		cell.addEventListener('blur', blurCell);
	}

	document.getElementById('menu').addEventListener('click', menu);
	document.querySelector('dialog').addEventListener('click', exitDialog);
	document.getElementById('playerCount').addEventListener('change', changePlayerCount);
	document.getElementById('reset').addEventListener('click', reset);

	loadStorage();
});
