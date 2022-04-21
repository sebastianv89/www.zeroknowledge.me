function playerCount() {
	return document.querySelector('#scorepad thead tr').children.length - 1;
}

function isEmptyRow(row) {
	return Array.prototype.every.call(row.children, cell => cell.textContent === '');
}

function removeEmptyRows() {
	const lastRow = document.querySelector('#scorepad tbody').lastElementChild;
	let prevRow = lastRow.previousElementSibling;
	while (prevRow !== null && isEmptyRow(prevRow)) {
		prevRow.remove();
		prevRow = lastRow.previousElementSibling;
	}
}

function updateSums() {
	let sums = new Array(playerCount()).fill(0);
	const rows = document.querySelectorAll('#scorepad tbody tr');
	for (const row of document.querySelectorAll('#scorepad tbody tr')) {
		for (let x = 0; x < sums.length; x += 1) {
			sums[x] += Number(row.children[x + 1].textContent);
		}
	}
	const totals = document.querySelectorAll('#scorepad tfoot td:not(:first-child)');
	for (let x = 0; x < sums.length; x += 1) {
		totals[x].textContent = sums[x];
	}
}

function htmlElement(html) {
	const template = document.createElement('template');
	template.innerHTML = html.trim();
	return template.content.firstChild;
}

function addEmptyRow() {
	const tbody = document.querySelector('#scorepad tbody');
	const tr = htmlElement('<tr><td></td></tr>');
	const pc = playerCount();
	for (let x = 0; x < pc; x += 1) {
		tr.append(htmlElement('<td contenteditable="true" inputmode="decimal">'));
	}
	document.querySelector('#scorepad tbody').append(tr);
}

function inputChanged(cell) {
	const x = Array.prototype.indexOf.call(cell.parentElement.children, cell);
	const score = Number(cell.textContent);
	if (Number.isNaN(score)) {
		cell.classList.add('invalid');
	} else {
		cell.classList.remove('invalid');
		const row = cell.parentElement;
		if (row.parentElement.lastElementChild === row) {
			addEmptyRow();
		}
	}
	removeEmptyRows();
	updateSums();
}

function setNames(names) {
	const ths = document.querySelectorAll('#scorepad thead th:not(:first-child)');
	for (let x = 0; x < ths.length; x += 1) {
		ths[x].textContent = names[x];
	}
}

function setScores(scores) {
	const pc = playerCount();
	let tr = document.querySelector('#scorepad tbody tr');
	let x = 0;
	for (let i = 0; i < scores.length; i += 1) {
		tr.children[x + 1].textContent = scores[i];
		tr.children[x + 1].classList.remove('invalid');
		x += 1;
		if (x === pc) {
			x = 0;
			if (tr.nextElementSibling === null) {
				addEmptyRow();
			}
			tr = tr.nextElementSibling;
		}
	}
	while (x < pc) {
		tr.children[x + 1].textContent = '';
		tr.children[x + 1].classList.remove('invalid');
		x += 1;
	}
	while (tr.nextElementSibling !== null) {
		tr.nextElementSibling.remove();
	}
	addEmptyRow();
	removeEmptyRows();
	updateSums();
}

function setPlayerCount(pc) {
	const thr = document.querySelector('#scorepad thead tr');
	while (thr.children.length - 1 > pc) {
		thr.lastElementChild.remove();
	}
	while (thr.children.length - 1 < pc) {
		thr.append(htmlElement(`<th contenteditable="true">Speler ${thr.children.length}</th>`));
	}
	const tbody = document.querySelector('#scorepad tbody');
	for (const tr of tbody.children) {
		while (tr.children.length - 1 > pc) {
			tr.lastElementChild.remove();
		}
		while (tr.children.length - 1 < pc) {
			tr.append(htmlElement('<td contenteditable="true" inputmode="decimal"></td>'));
		}
	}
	const tfr = document.querySelector('#scorepad tfoot tr');
	while (tfr.children.length - 1 > pc) {
		tfr.lastElementChild.remove();
	}
	while (tfr.children.length - 1 < pc) {
		tfr.append(htmlElement('<td>0</td>'));
	}
	document.getElementById('playerCount').value = pc;
}

function getStorageObject() {
	let names = [];
	for (const th of document.querySelectorAll('#scorepad thead th:not(:first-child)')) {
		names.push(th.textContent);
	}
	let scores = [];
	for (const tr of document.querySelectorAll('#scorepad tbody tr:not(:last-child)')) {
		for (const cell of tr.querySelectorAll('td:not(:first-child)')) {
			const score = Number(cell.textContent);
			if (cell.textContent === '' || Number.isNaN(score)) {
				scores.push(null);
			} else {
				scores.push(score);
			}
		}
	}
	return { names, scores };
}

function baseStorageName() {
	return 'score';
}

function getParameter(key, fallback) {
	const params = new URLSearchParams(window.location.search);
	const param = params.get(key) || localStorage.getItem(`${baseStorageName()}[${key}]`);
	if (param !== null) {
		return JSON.parse(param);
	}
	return fallback;
}

function setShareUrl(encodedNames, encodedScores) {
	const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
	const url = `${baseUrl}?names=${encodeURIComponent(encodedNames)}&scores=${encodeURIComponent(encodedScores)}`;
	document.getElementById('shareUrl').value = url;
}

// TODO save space by replacing null with empty strings
function saveStorage() {
	const { names, scores } = getStorageObject();
	const encodedNames = JSON.stringify(names);
	const encodedScores = JSON.stringify(scores);
	localStorage.setItem(`${baseStorageName()}[names]`, encodedNames);
	localStorage.setItem(`${baseStorageName()}[scores]`, encodedScores);
	setShareUrl(encodedNames, encodedScores);
}

function share() {
	const shareObj = {
		title: 'Score',
		url: document.getElementById('shareUrl').value
	};
	if (navigator.share) {
		navigator.share(shareObj);
	}
}

function initialize() {
	const names = getParameter('names', ['Speler 1', 'Speler 2']);
	const scores = getParameter('scores', []);
	setPlayerCount(names.length);
	setNames(names);
	setScores(scores);
	saveStorage(names, scores);
}

window.addEventListener('DOMContentLoaded', function() {
	// handle input
	document.querySelector('#scorepad tbody').addEventListener('input', e => inputChanged(e.target));

	// (de)select cell
	document.querySelector('#scorepad').addEventListener('focusin', e => {
		if (e.target.tagName !== 'BUTTON') {
			window.getSelection().selectAllChildren(e.target);
		}
	});
	document.querySelector('#scorepad').addEventListener('focusout', e => {
		window.getSelection().removeAllRanges();
		saveStorage();
	});
	
	// toggle menu
	document.getElementById('showMenu').addEventListener('click', _ => {
		document.getElementById('menu').showModal();
	});
	document.getElementById('menu').addEventListener('click', e => {
		if (e.target.id !== 'menu') {
			return;
		}
		const r = e.target.getBoundingClientRect();
		if (e.clientY < r.top || r.bottom < e.clientY || e.clientX < r.left || r.right < e.clientX) {
			e.target.close();
		}
	});

	// menu
	document.getElementById('share').addEventListener('click', _ => share());
	document.getElementById('playerCount').addEventListener('change', e => setPlayerCount(e.target.value));
	document.getElementById('new').addEventListener('click', _ => {
		if (window.confirm('Scores verwijderen?')) {
			setScores([]);
		}
	});

	// initialize table
	initialize();
});

