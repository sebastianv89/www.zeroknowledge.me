function colIndex(cell) {
	let y = 0;
	while (cell.previousElementSibling !== null) {
		cell = cell.previousElementSibling;
		y += 1;
	}
	return y;
}

function updateSums() {
	const rows = document.querySelector('tbody').children;
	let fullScore = true;
	let points = [0, 0, 0, 0];
	for (let z = 0; z < 4 && fullScore; z += 1) {
		for (let y = 0; y < 4; y += 1) {
			if (rows[5*z + y].children[1].textContent === "") {
				fullScore = false;
				break;
			}
			for (let x = 0; x < 4; x += 1) {
				points[x] += Number(rows[5*z + y].children[x + 1].textContent);
			}
		}
		for (let x = 0; x < 4 && fullScore; x += 1) {
			rows[5*z + 4].children[x + 1].textContent = points[x];
		}
	}
	if (fullScore) {
		const totals = document.querySelector('tfoot tr').children;
		totals[1].textContent = points[0] + points[1];
		totals[2].textContent = points[2] + points[3];
	} else {
	}
}

function updatePoints(event) {
	const cell = event.target;
	const points = Number(cell.textContent);
	const y = colIndex(cell);
	const row = cell.parentElement;
	if (y === 1) {
		row.children[3].textContent = 162 - points;
	} else if (y === 3) {
		row.children[1].textContent = 162 - points;
	}
	updateSums();
}

function focusCell(event) {
	window.getSelection().selectAllChildren(event.target);
}

function blurCell(event) {
	window.getSelection().removeAllRanges();
	storeScores();
}

function reset() {
	if (window.confirm("Scores verwijderen?")) {
		for (const cell of document.querySelectorAll('td:not(:first-child)')) {
			cell.textContent = "";
		}
		storeScores();
		updateSums();
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

function storeScores() {
	let scores = [];
	for (const tr of document.querySelectorAll('tbody tr')) {
		if (tr.firstElementChild.textContent === "") {
			continue;
		}
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
	console.log('storing', scores);
	localStorage.setItem('jassen', JSON.stringify(scores));
}

function loadStorage() {
	const scores = JSON.parse(localStorage.getItem('jassen'));
	console.log('loaded', scores);
	if (scores !== null) {
		const tbody = document.querySelector('tbody');
		for (let y = 0; y < scores.length; y += 1) {
			const tr = tbody.children[y + Math.floor(y/4)];
			for (let x = 0; x < 4; x += 1) {
				tr.children[x + 1].textContent = scores[y][x];
			}
		}
	}
	updateSums();
}

window.addEventListener('DOMContentLoaded', function() {
	for (let cell of document.querySelectorAll('tbody tr:not(.sum) td:not(:first-child)')) {
		cell.addEventListener('focus', focusCell);
		cell.addEventListener('blur', blurCell);
	}
	document.querySelector('tbody').addEventListener('input', updatePoints);

	document.getElementById('menu').addEventListener('click', menu);
	document.querySelector('dialog').addEventListener('click', exitDialog);
	document.getElementById('reset').addEventListener('click', reset);

	loadStorage();
});
