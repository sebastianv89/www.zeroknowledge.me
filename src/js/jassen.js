function colIndex(cell) {
	let y = 0;
	while (cell.previousElementSibling !== null) {
		cell = cell.previousElementSibling;
		y += 1;
	}
	return y;
}

function rowIndex(cell) {
	let x = 0;
	let row = cell.parentElement;
	while (row.previousElementSibling !== null) {
		row = row.previousElementSibling;
		x += 1;
	}
	return x;
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
}

function reset() {
	for (const cell of document.querySelectorAll('td:not(:first-child)')) {
		cell.textContent = "";
	}
	updateSums();
}

function fullScreen() {
	if (!document.fullscreenElement){
		document.body.requestFullscreen();
	} else {
		document.exitFullscreen();
	}
}

window.addEventListener('DOMContentLoaded', function() {
	for (let cell of document.querySelectorAll('tbody tr:not(.sum) td:not(:first-child)')) {
		cell.addEventListener('focus', focusCell);
		cell.addEventListener('blur', blurCell);
	}
	for (let cell of document.querySelectorAll('tbody td')) {
		cell.addEventListener('input', updatePoints);
	}
	document.getElementById('reset').addEventListener('click', reset);
});
